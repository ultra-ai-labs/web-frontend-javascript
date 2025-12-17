import React, {useEffect, useMemo, useState} from 'react';
import {Button, Checkbox, MessagePlugin, Space, Table} from 'tdesign-react';
import {
    createKvApi,
    getChatVersion,
    getDouyinAccounts, getKvApi,
    postLoginDouyin,
    postStartMarketByTaskIdApi,
    postStopMarketByTaskIdApi, updateKvApi
} from "../api/api";

const version = ["2.0", "2.1"]//插件exe版本管理
const AccountTable = ({
                          tasks,
                          taskId,
                          marketingScript,
                          setIsStartAble,
                          progress,
                          curMarketingTaskId,
                          setCurMarketingTaskId,
                          options
                      }) => {
    const [accounts, setAccounts] = useState([{username: '未登录', currentTask: '无', state: 0}]);

    const [isDisabled, setIsDisabled] = useState(false);//判断当前任务是否已经私信完
    const [taskList, setTaskListState] = useState(JSON.parse(localStorage.getItem("tasks")) || []); //TODO:没有意向客户 取出任务keyword和实时更新
    const [isFilteredIntend, setIsFilteredIntend] = useState(false);

    const updateCurMarketingTask = useMemo(() => { //更新curMarketingTaskId
        if (accounts.length === 0) {
            return [];
        }
        const taskIds = accounts
            .filter(account => account.state === 2 || account.state === 3)
            .map(account => account.task_id);
        return [...new Set(taskIds)];
    }, [accounts]);

    const saveMarketScript = async () => {//保存私信模板
        const back_data = {
            "task_id": taskId,
            "json_key": "marketScript",
            "json_value": marketingScript
        }
        await getKvApi(taskId, "marketScript").then(data => {
            if (data && data.code === 200) {
                if (data.data.length > 5) {
                    updateKvApi(back_data)
                } else {
                    createKvApi(back_data)
                }
            }
        })
    }

    const buttonMap = (account, index) => ({
        0: <Button theme="primary" variant="base" size="medium"
                   onClick={() => login(account, index)}>登录私信账号</Button>,
        1: <Button theme="primary" variant="base" size="medium" disabled={isDisabled}
                   onClick={() => startMarketing(account)}>开始私信</Button>,
        2: <Button theme="danger" variant="text" size="medium" disabled={isDisabled}
                   onClick={() => stopMarketing(account)}>暂停私信</Button>,
        3: <Button theme="danger" variant="text" size="medium" disabled={isDisabled}
                   onClick={() => stopMarketing(account)}>暂停私信 {account.update_timestamp}</Button>,
        4: <Button theme="warning" variant="text" size="medium" disabled={isDisabled}>已达上限</Button>,
        5: <Button theme="primary" variant="base" size="medium" disabled>等待登录中</Button>,
    });


    const addAccount = () => {
        if (accounts.length === 0) {
            setAccounts([{username: '未登录', currentTask: '无', state: 0}]);
        } else {
            setAccounts([...accounts, {username: '未登录', currentTask: '无', state: 0}]);
        }
    };

    const columns = [
        {
            title: <Space style={{width: '100%', justifyContent: 'space-between', alignItems: 'center'}}>
                <span>抖音账号名称</span>
                <Space><Checkbox style={{marginTop: '3px'}} value={isFilteredIntend}
                                 onChange={(value) => setIsFilteredIntend(value)}></Checkbox><strong
                    style={{color: 'black'}}>只私信筛选用户</strong></Space>
            </Space>,
            colKey: 'username',
            width: 200
        },
        {
            title: '当前私信任务',
            colKey: 'currentTask',
            width: 150,
            cell: ({row}) => {
                const isCurrentTask = row.task_id === taskId && row.state === 2;
                return (
                    <span style={{color: isCurrentTask ? 'blue' : 'black'}}>
                        {row.currentTask} {isCurrentTask ? '（当前任务）' : ''}
                    </span>
                );
            },
        },
        {
            title: '单号日限99个，小时限33个',
            colKey: 'marketing_count',
            width: 150,
            cell: ({row}) => {
                const isCurrentTask = row.task_id === taskId && row.state === 2;
                const color = isCurrentTask ? 'green' : row.marketing_count === 50 ? 'orange' : row.marketing_count > 0 ? 'blue' : 'gray';
                const displayCount = row.marketing_count > 0 ? row.marketing_count : 0;
                return (
                    <span style={{color}}>
                        {displayCount}/99
                    </span>
                );
            },
        },
        {
            title: (
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span>执行操作</span>
                    <Button type="primary" onClick={addAccount}>新增抖音账号</Button>
                </div>
            ),
            colKey: 'actions',
            align: 'center',
            width: 200,
            cell: ({row, rowIndex}) => buttonMap(row, rowIndex)[row.state],
        },
    ];

    const getAllAccounts = async () => {
        await getDouyinAccounts().then(data => {
            if (data && data.data) {
                const processedAccounts = data.data.accounts.map(account => {
                    const task = taskList.find(t => t.task_id === account.task_id);
                    if (task && account.state !== 1) {
                        account.currentTask = task.keyword;
                    } else {
                        account.currentTask = '无';
                    }
                    if (account.update_timestamp) {
                        account.update_timestamp = calculateCountdown(account.update_timestamp);
                    }
                    return account;
                });
                setAccounts(processedAccounts);
            }
        })
    };


    const login = async (account, index) => {
        console.log(account);

        let isStateReset = false;  // 标记是否已经通过 getAllAccounts 修改 state

        // 点击后将 accounts[index].state 设置为 5（表示禁用）
        setAccounts(prevAccounts => {
            const updatedAccounts = [...prevAccounts];
            updatedAccounts[index].state = 5;
            return updatedAccounts;
        });

        // 启动 15 秒倒计时后恢复 accounts[index].state（如果没有通过 getAllAccounts 修改过 state）
        setTimeout(() => {
            if (!isStateReset) {
                setAccounts(prevAccounts => {
                    const updatedAccounts = [...prevAccounts];
                    updatedAccounts[index].state = 0;  // 恢复为初始状态
                    return updatedAccounts;
                });
            }
        }, 120000);

        // 登录请求，等待结果但不影响按钮解禁
        try {
            const data = await postLoginDouyin();
            if (data && data !== 10000) {
                if (data === 500) {
                    MessagePlugin.warning('登录失败');
                } else {
                    getAllAccounts();
                    isStateReset = true;  // 一旦 getAllAccounts 执行，标记为 true
                }
            } else if (data === 10000) {
                setIsStartAble(true);
            }
        } catch (err) {
            if (err.message && err.message.includes('status: 500')) {
                MessagePlugin.error('登录失败');
            } else {
                setIsStartAble(true);
            }
        }
    };


    const startMarketing = (account) => {//开始私信
        let back_data = {
            user_id: account.user_id,
            task_id: taskId,
            message_text: marketingScript
        }
        if (isFilteredIntend) {
            if (options.ip_location !== '全选') {
                back_data = {...back_data, "ip_location": options.ip_location}
            }
            if (!isNaN(options.start_time && !isNaN(options.end_time))) {
                back_data = {...back_data, "start_time": options.start_time, "end_time": options.end_time}
            }
        }
        postStartMarketByTaskIdApi(back_data).then(data => {
            if (data && data.status === 200) {
                getAllAccounts()
                setCurMarketingTaskId(prevTaskIds => {//新增正在运行的任务
                    if (!prevTaskIds.includes(taskId)) {
                        return [...prevTaskIds, taskId];
                    }
                    return prevTaskIds;
                });
            } else if (data === 10000) {
                setIsStartAble(true)
            }
        })
            .catch(err => {
                    if (err.message && err.message.includes('status: 402')) {
                        MessagePlugin.error('冷却中，请稍后');
                    } else {
                        setIsStartAble(true);
                    }
                }
            );
        saveMarketScript()
    }

    const stopMarketing = (account) => {
        const back_data = {
            user_id: account.user_id,
            task_id: taskId
        }
        postStopMarketByTaskIdApi(back_data).then(data => {
            if (data && data.status === "success") {
                // getAllAccounts();
                setAccounts(prevAccounts => {// 在 accounts 中找到对应的 account 并修改其 currentTask 和 state（因为延后更新）
                    return prevAccounts.map(acc => {
                        if (acc.user_id === account.user_id) {
                            return {
                                ...acc,
                                currentTask: "无",
                                state: 1
                            };
                        }
                        return acc;
                    });
                });
                setCurMarketingTaskId(prevTaskIds => {//去除停止的任务
                    return prevTaskIds.filter(id => id !== taskId);
                });
            } else if (data === 10000) {
                setIsStartAble(true)
            }
        })
    }

    const calculateCountdown = (timestamp) => {//计算剩余时间
        // 将时间戳加上2小时（2小时 = 2 * 60 * 60 * 1000 毫秒）
        const updatedTimestamp = timestamp + 55 * 60 * 1000;
        const currentTime = Date.now();
        const countdown = updatedTimestamp - currentTime;
        const hours = Math.floor(countdown / (1000 * 60 * 60));
        const minutes = Math.floor((countdown % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((countdown % (1000 * 60)) / 1000);

        return `${hours}小时 ${minutes}分钟 ${seconds}秒`;
    }

    useEffect(() => {//提醒用户开插件和检查版本
        getChatVersion().then(data => {
                if (data === 10000 || data === 404) {
                    setIsStartAble(true)
                } else if (data.status === 200) {
                    if (!version.includes(data.version)) {
                        setIsStartAble(true)
                    }
                }
            }
        )
    }, []);

    useEffect(() => {
        setCurMarketingTaskId(updateCurMarketingTask)
    }, [updateCurMarketingTask]);

    useEffect(() => {//使用progress判断已完成
        if (progress === "100.00" || !taskId) {
            setIsDisabled(true);
        } else {
            setIsDisabled(false);
        }
    }, [progress, taskId]);

    useEffect(() => {//使用tasks设置账号
        setTaskListState(tasks)
        getAllAccounts()
    }, [tasks]);

    useEffect(() => {//根据curMarketingTaskId来决定要不要请求进度
        let intervalId;
        if (curMarketingTaskId.length > 0 && curMarketingTaskId.includes(taskId)) {
            intervalId = setInterval(() => {
                getAllAccounts();
            }, 10000);
        } else {
            if (intervalId) clearInterval(intervalId);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [curMarketingTaskId]);


    return (
        <Table columns={columns} data={accounts} rowKey={(row, index) => index} bordered maxHeight={1000}/>
    );
};

export default AccountTable;
