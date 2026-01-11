// src/pages/ReviewAnalyze.js
import React, { useState, useEffect, useRef } from 'react';
import {
    Radio,
    Space, Tag, Row, Col, Tooltip, Dropdown, MessagePlugin
} from 'tdesign-react';
import {
    getCommentListByTaskIdApi,
    startAnalysisApi,
    getAnalysisProgressApi,
    postTestAnalysisApi,
    stopAnalysisApi,
    updateMarketingUserApi,
    getKvApi,
    createKvApi,
    updateKvApi,
    getXhsApi,
    getQuote
} from '../api/api';

import AnalysisCommentTable from '../components/AnalysisCommentTable';
import AnalysisTaskList from '../components/AnalysisTaskList';
import AnalysisProgress from '../components/AnalysisProgress';
import AnalysisHeader from '../components/AnalysisHeader';
import ReviewReport from './ReviewReport';
import AnalysisTemplateDrawer from '../components/AnalysisTemplateDrawer';
import AnalysisCard from '../components/AnalysisCard';

const ReviewAnalyze = ({ tasks, selectedTask, fetchTasks, SeclectedReply, userSubscribeInfo }) => {
    // 函数来安全地获取数据
    const getLocalStorageData = (key, defaultValue) => {
        try {
            const storedData = localStorage.getItem(key);
            return storedData ? JSON.parse(storedData) : defaultValue;
        } catch (error) {
            console.error(`Error accessing localStorage key "${key}":`, error);
            return defaultValue;
        }
    };

    const [taskList, setTaskList] = useState(getLocalStorageData('tasks', tasks));
    const [inputValues, setInputValues] = useState(getLocalStorageData('inputValues', {}));
    const [currentTaskId, setCurrentTaskId] = useState(() => selectedTask?.task_id ?? getLocalStorageData('selectedTask', taskList.length > 0 ? taskList[0] : null)?.task_id ?? null);//当前taskList中选中的任务
    const [currentPlatform, setCurrentPlatform] = useState(selectedTask ? selectedTask.platform : null);
    const [currentKeyWord, setCurrentKeyword] = useState(selectedTask ? selectedTask.keyword : null);
    const [progress, setProgress] = useState(0);
    const [curAnalysisNum, setCurAnalysisNum] = useState(0)
    const [analysisState, setAnalysisState] = useState("initial");//当前分析处于哪一阶段
    const [progressLabel, setProgressLabel] = useState("");
    const [clientNum, setClientNum] = useState(0);
    // const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [shouldUpdateProgress, setShouldUpdateProgress] = useState(false);
    const firstPageComments = useRef([]); //第一页的评论-用来判断当前的模式
    const [comments, setComments] = useState([]);
    const [commentsTotal, setCommentsTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [buttonStatus, setButtonStatus] = useState({});
    const [activeMode, setActiveMode] = useState("1")//获客模式or品牌分析
    const [analysisResult, setAnalysisResult] = useState("column")//品牌分析展示表格还是圆饼图
    const [analysisAble, setAnalysisAble] = useState(true);
    const platformMap = {
        dy: '抖音',
        xhs: '小红书'
    };
    const [PieData, setPieData] = useState()
    const [allComments, setALLComments] = useState([]);
    const [templateContent, setTemplateContent] = useState({ content1: '', content2: '' });//模版值
    const [pieDataLoading, setPieDataLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('');
    const [chartOptions, setChartOptions] = useState({});
    const [emotionFilterValue, setEmotionFilterValue] = useState('');

    const handleSearchChange = (value) => {
        setSearchTerm(value);
    };

    const handleTemplateUse = (content1, content2) => {//传递模版值到分析
        setTemplateContent({ content1, content2 });
        // console.log('Content1:', content1);
        // console.log('Content2:', content2);
    };

    const updateProgress = async (taskId) => {//获取当前任务的进度
        if (taskId !== null && taskId !== undefined) {
            try {
                await getAnalysisProgressApi(taskId).then(data => {
                        if (data.msg === "success") {
                        const label = `进度：${data.data.num} / ${data.data.sum}`;
                        setProgressLabel((prevLabel) => (prevLabel !== label ? label : prevLabel));
                        let percentage = 0
                        if (data.data.sum !== 0) {
                            setCurAnalysisNum(data.data.num)
                            percentage = parseFloat(((data.data.num / data.data.sum) * 100).toFixed(2));
                        }
                        setProgress((prevProgress) => (prevProgress !== percentage ? percentage : prevProgress));
                        // remove incorrect state mapping; use data.data.state below
                        setClientNum(data.data.ic_num)
                        if (percentage === 100) {
                            setShouldUpdateProgress(false);
                        }
                        if (data.data.state === 1) {
                            // setIsButtonDisabled(false);
                            setAnalysisState("initial");
                        }
                        if (data.data.state === 2) {
                            // setIsButtonDisabled(true);
                            setAnalysisState("running");
                        }
                        if (data.data.state === 3) {
                            // setIsButtonDisabled(false);
                            setShouldUpdateProgress(false);
                            setAnalysisState("finish");
                            fetchTasks().then(() => setTaskList(JSON.parse(localStorage.getItem('tasks'))))//TODO:优化
                        }
                        if (data.data.state === 5) {
                            setShouldUpdateProgress(false);
                            setAnalysisState("stopped");
                            fetchTasks().then(() => setTaskList(JSON.parse(localStorage.getItem('tasks'))))
                        }
                        return percentage;

                    } else {
                        setClientNum(0);
                        setProgress(0)
                        setProgressLabel("0 / ")
                        return 0;
                    }
                }
                );
            } catch (error) {
                console.error('Failed to update progress:', error);
            }
        }
    }

    const curTaskId = useRef('')
    const platform = useRef('')
    useEffect(() => {
        curTaskId.current = currentTaskId
        platform.current = currentPlatform
    }, [currentTaskId, currentPlatform])

    const intentChangeHandler = async (option, comment) => {
        const back_data = {
            task_id: curTaskId.current,
            platform: platform.current,
            comment_id: comment.comment_id,
            intent_customer: option.value
        }

        await updateMarketingUserApi(back_data).then(data => {
            if (data.status === 200) {
                getComments(curTaskId.current)
            }
        })


    };


    const getComments = async (taskId) => { // 获取当前任务的评论
        if (taskId !== null && taskId !== undefined) {
            try {
                const data = await getCommentListByTaskIdApi(taskId, currentPage, pageSize);

                if (data && data.data) { // 检查 data 和 data.data 是否存在
                    let outputFields;
                    let simple_outputFields = [
                        { key: 'intent_customer', explanation: '表示是否为有意向的潜在用户（是、否、不确定）' },
                        { key: '分析理由', explanation: '20字内简要说明这么分析的理由' }
                    ];
                    let full_outputFields = simple_outputFields.concat([
                        { key: "情绪分析", explanation: "填写选项：正向、负向、中性" },
                        { key: "提及产品", explanation: "用户这条评论是否是围绕着本产品/品牌/服务在讨论（是、否、不确定）" },
                        { key: "满意点", explanation: "评论中对本产品/品牌/服务的满意点，没有就填写没有" },
                        { key: "不满点", explanation: "评论中对本产品/品牌/服务的不满点，没有就填写没有" },
                        { key: "疑问点", explanation: "评论中对本产品/品牌/服务的疑问点，没有就填写没有" }
                    ]);

                    let comment_list = data.data.comment_list || []; // 检查 comment_list 是否存在

                    if (comment_list.length > 0) {
                        outputFields = ('不满点' in comment_list[0]) ? full_outputFields : simple_outputFields;

                        let updatedComments = comment_list.map((comment, index) => {
                            let dynamicFields = {};
                            outputFields.forEach(field => {
                                let val = comment[field.key];
                                // 兼容后端返回的中文键名
                                if (field.key === 'intent_customer' && !val) {
                                    val = comment['意向客户'];
                                }

                                if (field.key === 'intent_customer') {
                                    dynamicFields[field.key] = val
                                        ? <Dropdown
                                            options={[
                                                { content: '高意向', value: '是' },
                                                { content: '潜在客', value: '不确定' },
                                                { content: '无意向', value: '否' }
                                            ].filter(option => option.value !== val)}
                                            onClick={(option) => {
                                                intentChangeHandler(option, comment);
                                            }}>
                                            <Tag
                                                theme={val === "是" ? "success" : val === "不确定" ? "warning" : "default"}
                                                variant={val === "是" ? 'dark' : 'outline'}>
                                                {val === "是" ? "高意向" : val === "不确定" ? "潜在客" : "无意向"}
                                            </Tag>
                                        </Dropdown>
                                        : val || '';
                                } else {
                                    dynamicFields[field.key] = val || '';
                                }
                            });

                            // 判断 package_type 和当前页码
                            let commentContent;
                            let userNickname;
                            if (userSubscribeInfo.package_type === '试用会员') {
                                if (currentPage <= 2) {
                                    commentContent = platform.current === 'xhs'
                                        ? <a href={`#${index}`} onClick={(e) => handleLinkClick(e, comment.内容链接)}>{comment.评论内容}</a>
                                        : <a href={comment.内容链接} target="_blank" rel="noreferrer">{comment.评论内容}</a>;
                                    userNickname = <a href={comment.用户链接} target="_blank" rel="noreferrer">{comment.用户昵称}</a>;
                                } else {
                                    commentContent = <span>{comment.评论内容}</span>;
                                    userNickname = <span>{comment.用户昵称}</span>;
                                }
                            } else {
                                commentContent = platform.current === 'xhs'
                                    ? <a href={`#${index}`} onClick={(e) => handleLinkClick(e, comment.内容链接)}>{comment.评论内容}</a>
                                    : <a href={comment.内容链接} target="_blank" rel="noreferrer">{comment.评论内容}</a>;
                                userNickname = <a href={comment.用户链接} target="_blank" rel="noreferrer">{comment.用户昵称}</a>;
                            }

                            return {
                                index: index + 1 + (currentPage - 1) * pageSize,
                                评论时间: comment.评论时间,
                                用户昵称: userNickname,
                                IP地址: comment.IP地址,
                                评论内容: commentContent, // 根据条件设置评论内容
                                buttonText: "测试", // 初始化按钮文字状态
                                ...dynamicFields,
                                comment_id: comment.comment_id
                            };
                        });
                        setCommentsTotal(data.data.total);
                        if (currentPage === 1) firstPageComments.current = updatedComments
                        setComments(updatedComments);
                    }
                } else {
                    console.warn('No data available for comments.');
                }
            } catch (error) {
                console.info('Failed to fetch comments:', error);
            }
        }
    };

    // eslint-disable-next-line
    const fetchProgress = async () => {//实时更新任务进度
        let per = 0;
        if (analysisState === "running") {
            getComments(currentTaskId);
            updateProgress(currentTaskId)
            if (0 < curAnalysisNum && curAnalysisNum < 20) {
                fetchTasks().then(setTaskList(JSON.parse(localStorage.getItem('tasks'))))
            }
        }

        if (per >= 95 && analysisState === 'finish') {
            fetchTasks().then(setTaskList(JSON.parse(localStorage.getItem('tasks'))))
        }
    }

    const handleInputChange = (taskId, value) => {
        setInputValues((prev) => {
            const newValues = { ...prev, [taskId]: value };
            localStorage.setItem("inputValues", JSON.stringify(newValues));
            return newValues;
        });
    };

    const updateTemplateContent = async (taskId) => {

        const jsonValue = {
            content1: templateContent.content1,
            content2: templateContent.content2
        }

        const back_data = {
            "task_id": taskId,
            "json_key": "template",
            "json_value": JSON.stringify(jsonValue)
        };

        const response = await getKvApi(taskId, "template");

        if (response.code === 200) {
            if (response.data.length === 0) {
                await createKvApi(back_data);
            } else {
                await updateKvApi(back_data);
            }
        }

    };

    const startAnalyze = async (taskId, commentId = null) => {
        updateTemplateContent(taskId)
        setAnalysisAble(false)
        const keyword = inputValues[taskId] || currentKeyWord;
        const raw_simple = {
            "comment_id": commentId,
            "task_id": taskId,
            "platform": currentPlatform,
            "analysis_request": `
            背景：现在要帮助一个${keyword}公司来分析用户在${currentPlatform}平台上关于${keyword}相关短视频内容下面的评论
            ${templateContent.content1 ? "我们的服务介绍是：" + templateContent.content1 : ""}
            ${templateContent.content2 ? "我想要的客户描述：" + templateContent.content2 : ""}
            目标：基于上面的背景，分析下面我提供的评论用户是否有可能成为我们可以服务或合作客户，包括不限于想了解我们的服务价格、或想学习、合作、加盟、购买相关产品/服务的意向
            注意：提供同样产品/服务的同行直接意向判定为否
            结果：按照下面格式要求输出
            `,
            "output_fields": [
                {
                    "key": "意向客户",
                    "explanation": `用户是否为有明确意向了解/购买${keyword}这个产品或服务相关信息的客户（是、否、不确定)`
                },
                {
                    "key": "分析理由",
                    "explanation": "20字内简要说明这么分析的理由"
                }
            ]
        };

        const raw_full = {
            "comment_id": commentId,
            "task_id": taskId,
            "platform": currentPlatform,
            "analysis_request": `
            背景：现在要帮助${keyword}相关的公司来分析用户在${currentPlatform}平台上关于${keyword}相关关键词内容下面的评论
            任务：分析这个评论的用户是否已经或可能成为相关服务的客户，并且分析评论中用户的情绪、提及相关产品/服务的情况、对相关产品/服务的满意点、不满点、疑问点
            结果：按照下面格式要求输出
            `,
            "output_fields": [
                {
                    "key": "意向客户",
                    "explanation": `分析下面我提供的评论用户是否已经或者有可能成为${keyword}这个关键词对应的品牌/服务/业务的客户，包括不限于想了解相关产品/服务价格、或想学习、合作、购买相关产品/服务的意向（填写：是、否、不确定)
                    对产品/服务有明确购买意向，填是，对产品/服务有疑问或比较纠结的客户，填不确定，对产品/服务无意向或批评，填否
                    `
                },
                {
                    "key": "情绪分析",
                    "explanation": "分析用户的情绪，填写选项：正向、负向、中性"
                },
                {
                    "key": "提及产品",
                    "explanation": `用户这条评论是否是围绕着${keyword}相关的产品/品牌或服务进行讨论（是、否、不确定）`
                },
                {
                    "key": "满意点",
                    "explanation": "评论中对本产品/品牌/服务的满意点，没有就填写没有"
                },
                {
                    "key": "不满点",
                    "explanation": "评论中对本产品/品牌/服务的不满点，没有就填写没有"
                },
                {
                    "key": "疑问点",
                    "explanation": "评论中对本产品/品牌/服务的疑问点，没有就填写没有"
                }
            ]
        };

        try {
            setButtonStatus((prev) => ({ ...prev, [commentId || taskId]: 'testing' }));
            let raw;
            if (activeMode === "1") {
                raw = raw_simple
            } else if (activeMode === "2") {
                raw = raw_full
            }
            // console.log(raw)
            if (commentId) {
                await postTestAnalysisApi(raw);
            } else {
                await startAnalysisApi(raw).then();
            }
            // 调用 updateProgress 更新进度条和任务状态
            await updateProgress(taskId);
            getComments(taskId).then(setAnalysisAble(true));
            setButtonStatus((prev) => ({ ...prev, [commentId || taskId]: 'tested' }));
            // setIsButtonDisabled(true);
            setShouldUpdateProgress(true);
            // setAnalysisState("running")
        } catch (error) {
            console.error('Failed to post analysis:', error);
            setButtonStatus((prev) => ({ ...prev, [commentId || taskId]: 'error' }));
        }
    };

    const stopAnalyze = async (taskId) => {
        setAnalysisAble(false)
        await stopAnalysisApi({ "task_id": taskId }).then(setTimeout(() => {
            setAnalysisAble(true)
        }, 2000))
        updateProgress(taskId)
    }

    const handleAnalysis = async (taskId) => {
        if (analysisState === 'initial' || analysisState === 'stopped') {
            try {
                const quoteResponse = await getQuote();
                if (quoteResponse && quoteResponse.data) {
                    const { used_quota, total_quota } = quoteResponse.data;
                    if (used_quota >= total_quota) {
                        MessagePlugin.error("分析额度已耗尽，请充值后重试");
                        return;
                    }
                }
            } catch (err) {
                console.error("Quota check failed:", err);
            }
            await startAnalyze(taskId);
        }
        else if (analysisState === 'running') await stopAnalyze(taskId);
        fetchTasks().then(setTaskList(JSON.parse(localStorage.getItem('tasks'))))
    }


    const handleTaskClick = (item) => {
        setCurrentTaskId(item.task_id);
        setCurrentPlatform(item.platform);
        setCurrentKeyword(item.keyword);
        setAnalysisState(item.analysis_state);
        setCommentsTotal(item.crawler_progress);
        localStorage.setItem('selectedTask', JSON.stringify(item));
        updateProgress(item.task_id);
        getComments(item.task_id);
    };

    // 自动刷新评论
    useEffect(() => {
        fetchProgress()
        // eslint-disable-next-line
        setAnalysisResult("column")
        // eslint-disable-next-line
    }, [currentTaskId, analysisState])


    // 更新输入
    useEffect(() => {
        const initialInputValues = tasks.reduce((acc, item) => {
            acc[item.task_id] = item.keyword;
            return acc;
        }, {});
        if (!localStorage.getItem("inputValues") || Object.keys(JSON.parse(localStorage.getItem("inputValues"))).length === 0) {
            setInputValues(initialInputValues);
            localStorage.setItem("inputValues", JSON.stringify(initialInputValues));
        } else {
            const storedValues = JSON.parse(localStorage.getItem("inputValues"));
            const afterValues = { ...initialInputValues, ...storedValues };
            const uniqueValues = {};
            for (const key in afterValues) {
                uniqueValues[key] = afterValues[key];
            }
            setInputValues(uniqueValues);
            localStorage.setItem("inputValues", JSON.stringify(uniqueValues));
        }

        const savedTask = JSON.parse(localStorage.getItem('selectedTask'));
        if (savedTask) {
            setCurrentTaskId(savedTask.task_id);
            setCurrentPlatform(savedTask.platform);
            setCurrentKeyword(savedTask.keyword);
        } else if (tasks.length > 0) {
            setCurrentTaskId(tasks[0].task_id);
            setCurrentPlatform(tasks[0].platform);
            setCurrentKeyword(tasks[0].keyword);
            localStorage.setItem('selectedTask', JSON.stringify(tasks[0]));
        }
    }, [tasks]);

    // 更新输入
    useEffect(() => {
        const intervalId = setInterval(fetchProgress, 5000); // 调整为5秒，减少请求频率

        return () => clearInterval(intervalId); // 清除定时器，防止内存泄漏
    }, [fetchProgress]); // 依赖 fetchProgress 确保引用最新的 currentTaskId 和 analysisState

    // 更新模式选择
    useEffect(() => {
        if (analysisState === 'finish' || (analysisState === 'running' && progress > 0) || (analysisState === 'initial' && progress > 0)) {
            if (firstPageComments.current && firstPageComments.current.length > 0) {
                if (firstPageComments.current[0]['不满点']) {
                    setActiveMode("2")
                } else setActiveMode("1")
            }
        } else if (analysisState === 'initial' && progress === 0) {
            setActiveMode("1")
        }
        // eslint-disable-next-line
    }, [firstPageComments.current, analysisState, currentTaskId, shouldUpdateProgress])

    // 默认加载进度
    useEffect(() => {
        updateProgress(currentTaskId).then()
        // eslint-disable-next-line
    }, [])

    // 更新评论
    useEffect(() => {
        getComments(currentTaskId)
        // eslint-disable-next-line
    }, [currentPage, pageSize])

    //更新本地报告
    useEffect(() => {

        if (activeMode === '2' && analysisState === 'finish') {
            const PieDataList = JSON.parse(localStorage.getItem(`${currentTaskId}-PieData`))
            if (PieDataList) {
                setPieData(PieDataList)
            } else {
                setALLComments([])
                setPieDataLoading(true)
                getAllComments()
            }
        }
        // eslint-disable-next-line
    }, [activeMode, analysisState, currentTaskId])

    const getAllComments = async () => {//请求所有评论
        try {
            const data = await getCommentListByTaskIdApi(currentTaskId, 1, commentsTotal);
            if (data.data) {
                const comment_list = data.data.comment_list;
                if (comment_list.length > 0) {
                    setALLComments(comment_list)
                    setPieDataLoading(false)
                }
            }
        } catch (error) {
            console.error('Failed to fetch all comments:', error);
        }
    }

    useEffect(() => {
        getAllComments()
        // eslint-disable-next-line
    }, [commentsTotal])


    const gotoReply = (val) => {
        SeclectedReply("c", currentTaskId)
    }

    // 添加 handleLinkClick 函数
    const handleLinkClick = async (e, originalLink) => {
        e.preventDefault();
        const match = originalLink.match(/explore\/([^/?]+)/);
        const id = match ? match[1] : null;
        if (id) {
            const response = await getXhsApi(id);
            if (response.code === 200 && response.data !== null) {
                const xhsLink = 'https://www.xiaohongshu.com/explore/' + response.data.explore + "?xsec_token=" + response.data.xsec_token + '&xsec_source=pc_search'
                window.open(xhsLink, '_blank');
            }
        } else {
            console.error("无法提取链接中的ID");
        }
    }

    useEffect(() => {
        if (chartOptions.title === "emotion") {
            setAnalysisResult("column")
            setEmotionFilterValue(chartOptions.name)
        }
    }, [chartOptions])

    return (
        <div style={{ display: 'flex', width: "100%" }}>
            <AnalysisTaskList
                mode="analyze"
                taskList={taskList}
                currentTaskId={currentTaskId}
                onTaskClick={handleTaskClick}
                platformMap={platformMap}
            />
            <Space direction="vertical" style={{
                marginLeft: "10px",
                height: "94vh",
                overflowX: "hidden",  // 隐藏水平滚动条
                overflowY: "auto",
                paddingLeft: "5px",
            }}>
                <AnalysisHeader
                    commentsTotal={commentsTotal}
                    currentKeyWord={currentKeyWord}
                    currentPlatform={currentPlatform}
                    inputValues={inputValues}
                    currentTaskId={currentTaskId}
                    handleInputChange={handleInputChange}
                    progress={progress}
                    handleAnalysis={handleAnalysis}
                    analysisState={analysisState}
                    analysisAble={analysisAble}
                    gotoReply={gotoReply}
                    activeMode={activeMode}
                    taskList={taskList}
                    setTaskList={setTaskList}
                    fetchTasks={fetchTasks}
                />
                {activeMode === '1' && analysisState !== 'finish' &&
                    <AnalysisTemplateDrawer taskId={currentTaskId} onTemplateUse={handleTemplateUse} inputValue={inputValues[currentTaskId]}
                        currentKeyWord={currentKeyWord} />}
                {activeMode === '1' && analysisState === 'finish' &&
                    <AnalysisCard taskId={currentTaskId} />}
                <Row>
                    {analysisState === 'finish' && activeMode === '2' && (
                        <Col flex="none">
                            <Radio.Group
                                style={{ marginRight: "15px" }}
                                size="medium"
                                value={analysisResult}
                                onChange={(v) => setAnalysisResult(v)}
                                variant='primary-filled'
                            >
                                <Radio.Button value="column" className="custom-radio-button">分析详情</Radio.Button>
                                <Radio.Button value="report" className="custom-radio-button">分析报告</Radio.Button>
                            </Radio.Group>
                        </Col>
                    )}
                    {analysisState === 'initial' && (
                        <Col>
                            <Radio.Group
                                style={{ marginRight: "15px" }}
                                size="medium"
                                value={activeMode}
                                disabled={progress > 0}
                                onChange={(v) => setActiveMode(v)}
                                variant='primary-filled'
                            >
                                <Tooltip content="只分析筛选意向客户" destroyOnClose showArrow theme="default">
                                    <Radio.Button value="1" className="custom-radio-button">获客模式</Radio.Button>
                                </Tooltip>
                                <Tooltip content="分析用户对品牌的情绪、满意度等信息" destroyOnClose showArrow
                                    theme="default">
                                    <Radio.Button value="2" className="custom-radio-button">品牌分析</Radio.Button>
                                </Tooltip>
                            </Radio.Group>
                        </Col>
                    )}
                    <Col flex="auto" style={{ marginTop: "2px" }}>
                        <AnalysisProgress
                            progressLabel={progressLabel}
                            progress={progress}
                            clientNum={clientNum}
                            commentsTotal={commentsTotal}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            setCurrentPage={setCurrentPage}
                            setPageSize={setPageSize}
                            onReply={gotoReply}
                            taskId={currentTaskId}
                            searchTerm={searchTerm}
                            handleSearchChange={handleSearchChange}
                        />
                    </Col>
                </Row>
                {analysisResult === 'column' && <AnalysisCommentTable
                    comments={comments}
                    allComments={allComments}
                    handleAnalysis={handleAnalysis}
                    buttonStatus={buttonStatus}
                    currentTaskId={currentTaskId}
                    activeMode={activeMode}
                    platform={platform}
                    userSubscribeInfo={userSubscribeInfo}
                    handleLinkClick={handleLinkClick}
                    intentChangeHandler={intentChangeHandler}
                    getAllComments={getAllComments}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    handleSearchChange={handleSearchChange}
                    emotionFilterValue={emotionFilterValue}
                />}
                {analysisResult === 'report' &&
                    <ReviewReport taskId={currentTaskId} commentList={allComments} commentsTotal={commentsTotal}
                        PieData={PieData}
                        pieDataLoading={pieDataLoading}
                        setChartOptions={setChartOptions}
                    />
                }
            </Space>
        </div>
    );
};

export default ReviewAnalyze;
