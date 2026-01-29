import React, {useEffect, useState} from 'react';
import {Button, Dropdown, Layout, Menu, Row, Space} from 'tdesign-react';
import {Icon, ListIcon, UserListIcon, LogoWecomIcon} from 'tdesign-icons-react';
import ReviewCollection from './ReviewCollection';
import ReviewAnalyze from "./ReviewAnalyze";
import {getTaskListApi, getUserInfo} from '../api/api';
import {formatDate} from '../utils';
import ReviewReply from "./ReviewReply";

const {Header, Content} = Layout;
const {HeadMenu, MenuItem} = Menu;

function Home() {
    const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab') || 'a');
    const [accountName, setAccountName] = useState("");
    const [tasks, setTasks] = useState([]);
    const [totalTask, setTotalTask] = useState(0);
    const [selectedTask, setSelectedTask] = useState(null);
    const [userSubscribeInfo, setUserSubscribeInfo] = useState({})

    const Logout = () => {
        let savedInputValues = {}
        if (localStorage.getItem("inputValues") && Object.keys(JSON.parse(localStorage.getItem("inputValues"))).length !== 0) {
            savedInputValues = JSON.parse(localStorage.getItem("inputValues"));
        }
        const allKeys = Object.keys(localStorage);
        const tempStorage = {};
        allKeys.forEach(key => {
            if (key.endsWith('-PieData') || key.endsWith('-detailData') || key.endsWith('-intentorSatisfaction') || key.endsWith('-templates') || key.endsWith('-userLinkList')) {
                tempStorage[key] = JSON.parse(localStorage.getItem(key));
            }
        });

        localStorage.clear();

        localStorage.setItem("inputValues", JSON.stringify(savedInputValues));
        for (const [key, value] of Object.entries(tempStorage)) {
            localStorage.setItem(key, JSON.stringify(value));
        }

        window.location.href = '/login';
    };

    const getLocalStorageData = (key, defaultValue) => {
        try {
            const storedData = localStorage.getItem(key);
            return storedData ? JSON.parse(storedData) : defaultValue;
        } catch (error) {
            console.error(`Error accessing localStorage key "${key}":`, error);
            return defaultValue;
        }
    };


    const handleTabChange = (value, task = null) => {
        setActiveTab(value);
        setSelectedTask(task);
        localStorage.setItem('activeTab', value);
        if (task) {
            localStorage.setItem('selectedTask', JSON.stringify(task));
        }
    };

    const SeclectedReply = (value, taskId) => {
        setActiveTab(value);
        localStorage.setItem('activeTab', value);
        if (taskId) {
            localStorage.setItem('curTaskId', taskId);
        }
    }

    const fetchTasks = async () => {
        try {
            await loadAllTasks()
        } catch (error) {
            console.error("主页 fetching task list:", error);
        }
    };

    const loadAllTasks = async () => {
        try {
            const {data} = await getTaskListApi(0, 5); // 初始请求获取totalTask
            const totalTask = data.total;
            localStorage.setItem('totalTask', totalTask);
            const modifiedTaskList = data.task_list.map((task) => ({
                ...task,
                create_time: formatDate(task.create_time),
            }));
            if (totalTask > 5) {
                const {data: allData} = await getTaskListApi(5, totalTask - 5); // 请求剩余的任务
                const allModifiedTaskList = allData.task_list.map((task) => ({
                    ...task,
                    create_time: formatDate(task.create_time),
                }));
                const allTasks = [...modifiedTaskList, ...allModifiedTaskList].filter(task => task.platform === 'dy');
                setTasks(allTasks);
                localStorage.setItem('tasks', JSON.stringify(allTasks));
            } else {
                const filteredTasks = modifiedTaskList.filter(task => task.platform === 'dy');
                setTasks(filteredTasks);
                localStorage.setItem('tasks', JSON.stringify(filteredTasks));
            }
            setTotalTask(totalTask);
        } catch (error) {
            console.error("主页 loading all tasks:", error);
        }
    };


    const renderContent = () => {
        switch (activeTab) {
            case 'a':
                return <ReviewCollection tasks={tasks} fetchTasks={fetchTasks} totalTask={totalTask}
                                         userSubscribeInfo={userSubscribeInfo}
                                         handleTabChange={handleTabChange}
                                         accountName={accountName}/>;
            case 'b':
                return <ReviewAnalyze tasks={tasks} selectedTask={selectedTask} fetchTasks={fetchTasks}
                                      userSubscribeInfo={userSubscribeInfo}
                                      totalTask={totalTask} SeclectedReply={SeclectedReply}/>;
            case 'c':
                return <ReviewReply tasks={tasks} selectedTask={selectedTask} fetchTasks={fetchTasks}
                                    totalTask={totalTask} getLocalStorageData={getLocalStorageData}/>;
            default:
                return <div>选择一个菜单项来查看内容。</div>;
        }
    };

    const handleClick = (data) => {
        if (data.value === 'logout') Logout();
        else if (data.value === 'personal') showPerson();
    }

    const showPerson = () => {

    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以要加1
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    useEffect(() => {
        const storedTab = localStorage.getItem('activeTab');
        if (storedTab) {
            setActiveTab(storedTab);
        }
        if (localStorage.getItem("userInfo")) {
            setAccountName(JSON.parse(localStorage.getItem("userInfo")).username);
        }
        loadAllTasks();

        getUserInfo().then(data => {
            if (data.data) {
                const userInfo = data.data;
                userInfo.package_type = userInfo.package_type === 0
                    ? '试用会员'
                    : userInfo.package_type === 1
                        ? '个人会员'
                        : '企业会员';

                userInfo.subscription_end_date = formatTimestamp(userInfo.subscription_end_date);
                setUserSubscribeInfo(userInfo);
            }
        }).catch(err => console.log(err))
    }, []);

    return (
        <Layout>
            <Header>
                <HeadMenu
                    value={activeTab}
                    logo={<Row>
                        <img style={{width: "30px", marginLeft: 25, marginTop: 15, marginRight: 10}}
                             src={`${process.env.PUBLIC_URL}/favicon.png`} alt="logo"/>
                        <h2 style={{color: "#3491FA"}}>智擎获客</h2>
                    </Row>}
                    onChange={handleTabChange}
                    operations={
                        <div className="t-menu__operations">
                            <Space align='center'>
                                <Row style={{marginTop: "4px"}}>
                                    <span
                                        style={{color: '#3491FA', cursor: 'pointer'}}
                                        onClick={() => window.open('https://xcn9f50y4vw5.feishu.cn/wiki/Y26hwDUgAioiDzkx7CbcZFC5n1b?from=from_copylink', '_blank')}
                                    >使用文档</span>
                                    <span style={{
                                        color: userSubscribeInfo.package_type === "个人会员" ? "#366EF4" :
                                            userSubscribeInfo.package_type === "试用会员" ? "#65B0F4" :
                                                userSubscribeInfo.package_type === "企业会员" ? "#FA9550" : "#FA9550"
                                    }}>&nbsp;&nbsp;{userSubscribeInfo.package_type}</span>
                                    <span>&nbsp;至 {userSubscribeInfo.subscription_end_date}</span>
                                </Row>
                                <Dropdown
                                    onClick={handleClick}
                                    options={
                                        [{
                                            content: '退出登录',
                                            value: 'logout',
                                        },
                                            //     {
                                            //     content: '个人中心',
                                            //     value: 'personal',
                                            // }
                                        ]}
                                >
                                    <Button variant="text" suffix={<Icon name="chevron-down" size="16"/>}>
                                        {accountName}
                                    </Button>
                                </Dropdown>
                            </Space>
                        </div>
                    }
                >
                    <MenuItem value="a" icon={<ListIcon/>}>收集内容评论</MenuItem>
                    <MenuItem value="b" icon={<UserListIcon/>}>分析客户意向</MenuItem>
                    <MenuItem value="c" icon={<LogoWecomIcon/>}>私信意向客户</MenuItem>
                </HeadMenu>
            </Header>
            <Content style={{background: "white"}}>
                {renderContent()}
            </Content>
        </Layout>
    );
}

export default Home;
