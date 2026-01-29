import React, {useEffect, useState} from 'react';
import {Checkbox, Menu, Space, Tooltip} from 'tdesign-react';
import {CheckCircleIcon, LoadingIcon, PlayCircleIcon, PauseCircleIcon} from 'tdesign-icons-react';
import dyIcon from '../public/dy.svg';
import xhsIcon from '../public/xhs.svg'

const {MenuItem} = Menu;
const AnalysisTaskList = ({mode, taskList, currentTaskId, onTaskClick}) => {
    const getIcon = (status) => {
        switch (status) {
            case 'running':
                return <Tooltip
                    content="运行中"
                    destroyOnClose
                    showArrow
                    theme="default"
                >
                    <LoadingIcon style={{color: '#fa8c16'}}/>
                </Tooltip>;
            case 'initial':
                return <Tooltip
                    content="待开始"
                    destroyOnClose
                    showArrow
                    theme="default">
                    <PlayCircleIcon style={{color: '#1890ff'}}/>
                </Tooltip>;
            case 'finish':
                return <Tooltip
                    content="已完成"
                    destroyOnClose
                    showArrow
                    theme="default"
                >
                    <CheckCircleIcon style={{color: '#52c41a'}}/>
                </Tooltip>;
            case 'stopped':
                return <Tooltip
                    content="已暂停"
                    destroyOnClose
                    showArrow
                    theme="default"
                >
                    <PauseCircleIcon style={{color: '#ff85c0'}}/>
                </Tooltip>;
            default:
                return null;
        }
    };

    const [checkedOptions, setCheckedOptions] = useState([])//reply页面的checkbox
    const [showTaskList, setShowTaskList] = useState(taskList)
    const handleCheckboxChange = (value) => {
        setCheckedOptions(value)
    }

    const platformIconMap = {
        'dy': <img src={dyIcon} alt="Prefix Icon" style={{width: '20px', height: '20px'}}/>,
        'xhs': <img src={xhsIcon} alt="Prefix Icon" style={{width: '20px', height: '20px'}}/>
    }

    useEffect(() => {//AnalysisTaskList筛选的checkBox
        if (taskList.length) {
            const platformFilteredList = taskList.filter(task => task.platform !== 'xhs');
            if (checkedOptions.length === 1 && checkedOptions[0] === 'dy') {
                setShowTaskList(platformFilteredList)
            } else {
                setShowTaskList(platformFilteredList)
            }
        }
        // eslint-disable-next-line
    }, [checkedOptions,taskList])

    return (
        <Menu expandType="normal" theme="light"
              logo={mode === "analyze"
                  ? <h2>任务列表 共{taskList.length}个</h2>
                  : <h2 style={{marginLeft: '30px'}}>任务列表</h2>}
              value={`task-${currentTaskId}`}
              style={{height: "90vh", width: "270px"}}>
            {showTaskList.map((item) => (
                <MenuItem
                    key={item.task_id}
                    value={`task-${item.task_id}`}
                    onClick={() => onTaskClick(item)}
                    icon={mode === "analyze" ? getIcon(item.analysis_state) : getIcon(item.market_state)}
                >
                    <Space style={{width: '200px', justifyContent: 'space-between'}} align='center'>
                        <p style={{width: '150px'}}>{item.keyword}</p>
                        {/* <div style={{marginTop: "10px"}}>{platformIconMap[item.platform] || item.platform}</div> */}
                    </Space>
                </MenuItem>
            ))}
        </Menu>

    );
};

export default AnalysisTaskList;
