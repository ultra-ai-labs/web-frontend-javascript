import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
    Button,
    Space,
    Textarea,
    Progress, NotificationPlugin, Loading, Popconfirm, Col, Row, Radio
} from 'tdesign-react';
import {
    getMarketListByTaskIdApi,
    getMarketProgressApi, getUserSatisfactionApi,
    postKeyword, testUserSatisfactionApi,
} from "../api/api";
import AnalysisTaskList from "../components/AnalysisTaskList";
import ReplyIntentorTable from '../components/ReplyIntentorTable';
import {ReplyIntentorSatisfaction} from '../components/ReplyIntentorSatisfaction';
import dyIcon from "../public/dy.svg";
import xhsIcon from "../public/xhs.svg";
import AccountTable from "../components/ReplyAccountTable";

const platformMap = {
    dy: '抖音',
    xhs: '小红书'
};

export default function ReviewReply({tasks, getLocalStorageData}) {
    const initialTasks = getLocalStorageData("tasks", tasks) || tasks;
    const [taskList, setTaskList] = useState(initialTasks.filter(task => task.analysis_state === 'finish'));
    const [curMarketingTaskId, setCurMarketingTaskId] = useState([]);//正在私信的任务列表
    const [curTaskId, setCurTaskId] = useState(localStorage.getItem("curTaskId") || taskList[0]?.task_id || "");//现在左栏选中的任务
    // eslint-disable-next-line
    const [curTask, setCurTask] = useState(taskList.find(task => task.task_id === curTaskId) || {
        "platform": "dy",
        "keyword": "暂未收集评论"
    });
    const [marketingScript, setMarketingScript] = useState(``)//私信的话术文本框
    const [curProgress, setCurProgress] = useState(0);
    const [marketingNum, setMarketingNum] = useState(0);//意向客户数量
    const [userLinkList, setUserLinkList] = useState([])
    const userCount = useRef()
    const [loading, setLoading] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false)//意向分析等待
    // const [comment_list, setComment_list] = useState([])
    const [textareaValue, setTextareaValue] = useState('');//弹出框的文本内容
    // const [checkedOptions, setCheckedOptions] = useState([])
    const progress = useMemo(() => {
        if (marketingNum === 0) return (0).toFixed(2);
        return (curProgress / marketingNum * 100).toFixed(2);
    }, [curProgress, marketingNum]);
    const [tableValue, setTableValue] = useState('customer');
    const [isStartAble, setIsStartAble] = useState(false);//私信插件是否在运行

    const [satisfactionData, setSatisfactionData] = useState([]);//满意、不满、疑问点
    const [questionData, setQuestionData] = useState([]);
    const [dissatisfactionData, setDissatisfactionData] = useState([]);
    const hasData = useRef(false);//是否要生成满意点
    const [options, setOptions] = useState({});//私信的时间和地区选项

    useEffect(() => {//根据curMarketingTaskId来决定要不要请求进度
        let intervalId;
        if (curMarketingTaskId.length > 0 && curMarketingTaskId.includes(curTaskId)) {
            intervalId = setInterval(() => {
                getMarketProgress(curTaskId);
            }, 10000);
        } else {
            if (intervalId) clearInterval(intervalId);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
        // eslint-disable-next-line
    }, [curMarketingTaskId]);

    useEffect(() => {//当前任务改变（合并了curTaskId）

        //修改用户的私信话术
        const tempScript = localStorage.getItem(`${curTaskId}-marketingScript`);
        if (tempScript) {
            setMarketingScript(tempScript);
        } else {
            if (curTask && curTask.keyword) {
                if (curTask.keyword === '暂未收集评论') {
                    setMarketingScript(''); // 当 keyword 为空时，设置空话术
                } else {
                    setMarketingScript(`有${curTask.keyword}需求吗？`); // 当 keyword 有值时，设置相关话术
                }
            } else {
                setMarketingScript(''); // 当 curTask 或 keyword 不存在时，设置空话术
            }
        }

        //初始化访问接口
        const fetchProgress = async () => {
            if (!curTask) return;
            setLoading(true);
            setAnalysisLoading(true);
            const promises = []
            if (curTask.platform === 'dy') promises.push(getMarketProgress(curTaskId));
            promises.push(getMarketingUserList(0, 10));
            await Promise.all(promises);
            setLoading(false);

            await getMarketingUserList(0, userCount.current);
        };
        fetchProgress()

        //限制小红书访问AccountTable
        if (curTask.platform === 'xhs') setTableValue('customer')
        // eslint-disable-next-line

        //跳转页面
        if (curMarketingTaskId.length > 0 && curMarketingTaskId.includes(curTaskId)) {
            setTableValue("account")
        }
        // eslint-disable-next-line
    }, [curTask])

    useEffect(() => {//AccountTable提示用户开启安装插件
        if (isStartAble) {
            showNotice()
        }
        setIsStartAble(false)
    }, [isStartAble, progress])

    useEffect(() => {//Satisfaction部分的请求逻辑
        const getData = async () => {
            await getUserSatisfaction()
            if (!hasData.current) {
                await testUserSatisfaction()
            }
            setAnalysisLoading(false)
        }
        if (curTaskId) getData()
        // eslint-disable-next-line
    }, [curTaskId]);

    const getMarketingUserList = async (offset, count) => {
        const localStorageKey = `${curTaskId}-userLinkList`;

        try {
            // 如果count大于0，则进行请求操作
            if (count > 0) {
                await getMarketListByTaskIdApi(curTaskId, offset, count)
                    .then(data => {
                        if (data && data.user_link_list) {
                            setUserLinkList(data.user_link_list);
                            setMarketingNum(data.total_count);

                            // 当count大于20时，缓存到localStorage
                            if (count > 20) {
                                localStorage.setItem(localStorageKey, JSON.stringify(data.user_link_list));
                            }

                            userCount.current = data.total_count;
                            return data.user_link_list;
                        } else {
                            setUserLinkList([]);
                        }
                    })
            } else {
                // 处理count为0或其他情况
                setUserLinkList([]);
                setMarketingNum(0);
                setAnalysisLoading(false);
            }
        } catch (error) {
            console.error("获取意向客户列表时发生错误: ", error);
            setUserLinkList([]);
            setMarketingNum(0);
            setAnalysisLoading(false);
        }
    };

    const showNotice = () => {
        NotificationPlugin.info({
            title: '提示信息',
            content: (
                <Space align="center">
                    <p>请下载安装私信支持程序（如已下载请运行程序）</p>
                    <Button theme="primary" variant="text"
                            onClick={() => window.open('https://pan.baidu.com/s/17rfrGGTRQYcdkyQwDPVjMg?pwd=ziui', '_blank')}>
                        下载程序
                    </Button>
                </Space>
            ),
            placement: 'top-left',
            duration: 20000,
            closeBtn: true,
        });
    }

    const getMarketProgress = async (taskId) => {//获取私信进度
        if (taskId) {
            try {
                const data = await getMarketProgressApi(taskId);
                setCurProgress(data.data.num);
                setMarketingNum(data.data.sum)
            } catch (error) {
                console.log('获取私信失败:', error);
            }
        }
    };

    const handleTaskClick = async (item) => {
        setCurTaskId(item.task_id);
        setCurTask(item);
        localStorage.setItem("curTaskId", item.task_id);
    };

    const handleUpdateScript = async () => {
        const messages = [
            {
                role: "system",
                content: `背景：我们是一家提供${curTask.keyword}相关服务的公司，我们分析了${platformMap[curTask.platform]}平台上用户对这类服务的介绍视频下面的评论观点
                               以下是一些相关用户对我们的服务提出的满意点、不满点、以及疑问点的内容：
                               满意点：${satisfactionData}
                               不满点：${dissatisfactionData}
                               疑问点：${questionData}
                               
                               然后我们现在的私信话术是：${marketingScript} 
                               
                          目标：基于上面背景设计优化出给用户私信第一句打招呼合适的话术
                          
                          风格：不要像一个AI客服一样死板，可以保留一定的口语性
                               举个例子：
                               开头：你好呀/嗨～，有xxx（相关服务）需求么？我们是（专业的相关服务提供商）                        
                               中间：要说出用户可能感兴趣和满意的点/成功案例
                               结尾：有兴趣可以私我哦～
                          
                          行动：先思考业务行业与背景，再结合平台上用户的特点，以及跟陌生人打招呼需要的心理学知识，写出优化的话术
                          
                          结果：1.直接输出优化后的话术，尽量能引起用户有兴趣并回复，可以酌情引入成功案例，最多不要超过80字       
                               2.不要暴露你是从评论获取到的用户信息，而且结尾不要说“我等你”之类的话                                          
                         `
            }
        ];
        const response = await postKeyword(messages)
        setTextareaValue(response.choices[0].message.content);
    }

    // const handleCheckboxChange = (value) => {
    //     setCheckedOptions(value)
    // }

    const platformIconMap = {
        'dy': <img src={dyIcon} alt="Prefix Icon" style={{width: '24px', marginTop: '16px'}}/>,
        'xhs': <img src={xhsIcon} alt="Prefix Icon" style={{width: '24px', marginTop: '16px'}}/>
    }

    const getUserSatisfaction = async () => {//获取satisfaction
        await getUserSatisfactionApi(curTaskId).then(data => {
            if (data && data.status === 200 && data.msg === 'success' && data.data) {
                setSatisfactionData(data.data.满意点.split(';').map(item => item.trim()));
                setDissatisfactionData(data.data.不满点.split(';').map(item => item.trim()));
                setQuestionData(data.data.疑问点.split(';').map(item => item.trim()));
                hasData.current = true
            } else {
                setSatisfactionData([])
                setDissatisfactionData([])
                setQuestionData([])
                hasData.current = false
            }
        }).catch(error => {
            console.error('Failed to fetch user satisfaction data:', error);
        });
    }

    const testUserSatisfaction = async () => {//生成satisfaction
        await testUserSatisfactionApi(curTaskId).then(data => {
            if (data && data.status === 200) {
                getUserSatisfaction()
            }
        })
    }

    return (
        <div className="tabs-content" style={{display: 'flex', width: '100%'}}>
            <Space direction='vertical'>
                <AnalysisTaskList
                    mode="reply"
                    taskList={taskList}
                    currentTaskId={curTaskId}
                    onTaskClick={handleTaskClick}
                    platformMap={platformMap}
                />
            </Space>

            <Space direction="vertical" style={{marginLeft: "10px", gap: 0}}>
                <Space style={{gap: 0}}>
                    <Space direction="vertical" size="large" style={{minWidth: "550px"}}>
                        <Space style={{width: '100%'}} align="center" direction="vertical">
                            <Row style={{width: '100%', justifyContent: 'space-between'}} align="center">
                                <Row style={{height: "1px"}}>
                                    {curTask ? platformIconMap[curTask.platform] : ""}
                                    <h2>&nbsp;{curTask ? `${curTask.keyword} ${marketingNum}个意向` : ''}</h2>
                                </Row>
                                <Popconfirm
                                    style={{width: '250px'}}
                                    content={
                                        <Textarea
                                            value={textareaValue}
                                            autosize
                                            onChange={(value) => {
                                                setTextareaValue(value);
                                                localStorage.setItem(`${curTaskId}-marketingScript`, value);
                                            }}
                                            placeholder="正在生成话术"
                                            style={{width: "250px"}}
                                        />
                                    }
                                    onCancel={() => setTextareaValue('')}
                                    confirmBtn={
                                        <Button theme="primary" size="small" onClick={() => {
                                            setMarketingScript(textareaValue)
                                            localStorage.setItem(`${curTaskId}-marketingScript`, textareaValue)
                                        }}>
                                            采纳
                                        </Button>
                                    }
                                    cancelBtn={
                                        <Button theme="default" size="small" variant="outline">
                                            取消
                                        </Button>
                                    }
                                    icon={<></>}  // 去掉感叹号图标
                                >
                                    <Button theme="primary" onClick={handleUpdateScript} style={{marginTop: "12px"}}>
                                        话术优化
                                    </Button>
                                </Popconfirm>
                            </Row>
                        </Space>
                        <Space direction='vertical' style={{width: "100%", marginTop: "-10px"}}>
                            <Textarea style={{width: "100%"}}
                                      placeholder="输入私信打招呼话术，例如：有留学需求吗？"
                                      autosize={{minRows: 5}}
                                      value={marketingScript}
                                      onChange={(value) => {
                                          setMarketingScript(value);
                                          localStorage.setItem(`${curTaskId}-marketingScript`, value);
                                      }}
                            />
                            <Row>
                                <Col>
                                    {curTask.platform === 'dy' ?
                                        <Radio.Group
                                            style={{marginRight: "15px", marginBottom: "15px"}}
                                            size="medium"
                                            value={tableValue}
                                            onChange={(v) => {
                                                setTableValue(v)
                                            }}
                                            variant='primary-filled'
                                        >
                                            <Radio.Button value="customer"
                                                          className="custom-radio-button">意向客户</Radio.Button>
                                            <Radio.Button value="account"
                                                          className="custom-radio-button">前往私信</Radio.Button>
                                        </Radio.Group> : ''}
                                </Col>
                                <Col>
                                    {
                                        curTask.platform === 'xhs' ?
                                            <Col style={{
                                                marginTop: 5,
                                                marginLeft: 10
                                            }}>小红书平台不支持电脑端私信，可鼠标移动到用户名处手机扫码私信</Col> :
                                            <Col style={{
                                                marginTop: 5,
                                                marginLeft: 10
                                            }}>
                                                <Row>
                                                    <Col>
                                                        私信进度：{curProgress}/{marketingNum}
                                                    </Col>
                                                    <Col style={{width: "200px", marginLeft: 10}}>
                                                        <Progress
                                                            label
                                                            percentage={progress}
                                                            theme="line"
                                                        />
                                                    </Col>
                                                </Row>
                                            </Col>
                                    }
                                </Col>
                            </Row>
                        </Space>
                    </Space>
                    <Space>
                        <Loading loading={analysisLoading} text="拼命加载中..." size="small">
                            <ReplyIntentorSatisfaction
                                setAnalysisLoading={setAnalysisLoading} taskId={curTaskId}
                                satisfactionData={satisfactionData} dissatisfactionData={dissatisfactionData}
                                questionData={questionData}/>
                        </Loading>
                    </Space>
                </Space>
                <Space style={{width: "83vw"}}>
                    {tableValue === 'account' &&
                        <AccountTable tasks={tasks} setTaskList={setTaskList} taskId={curTaskId}
                                      marketingScript={marketingScript} setIsStartAble={setIsStartAble}
                                      progress={progress}
                                      setCurMarketingTaskId={setCurMarketingTaskId}
                                      curMarketingTaskId={curMarketingTaskId}
                                      options={options}/>}
                    {tableValue === 'customer' &&
                        <Loading loading={loading} text="拼命加载中..." size="small">
                            <ReplyIntentorTable userLinkList={userLinkList} taskId={curTaskId} total={userCount.current}
                                                platform={curTask.platform}
                                                getMarketingUserList={getMarketingUserList}
                                                curMarketingTaskId={curMarketingTaskId}
                                                setOptions={setOptions}/>
                        </Loading>}
                </Space>
            </Space>
        </div>
    );
}
