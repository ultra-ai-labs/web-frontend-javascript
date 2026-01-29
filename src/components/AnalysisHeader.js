import React, {useEffect, useState} from 'react';
import {Input, InputAdornment, Button, Row, Space} from 'tdesign-react';
import dyIcon from "../public/dy.svg";
import xhsIcon from "../public/xhs.svg";
import {getTaskIdAnalysisResultApi} from "../api/api";

const AnalysisHeader = ({
                            commentsTotal,
                            currentKeyWord,
                            currentPlatform,
                            inputValues,
                            currentTaskId,
                            handleInputChange,
                            progress,
                            handleAnalysis,
                            analysisState,
                            analysisAble,
                            gotoReply,
                            activeMode,
                            taskList,
                            setTaskList,
                            fetchTasks
                        }) => {
    const handleDownload = () => {
        getTaskIdAnalysisResultApi(currentTaskId).then(data => {
            if (data.data.url) {
                window.open(data.data.url, '_blank');
            }
        })
    };

    const platformIconMap = {
        'dy': <img src={dyIcon} alt="Prefix Icon" style={{width: '24px', marginTop: '16px'}}/>,
        'xhs': <img src={xhsIcon} alt="Prefix Icon" style={{width: '24px', marginTop: '16px'}}/>
    }

    useEffect(() => {
        const changeTaskList = taskList.map((item) => {
            if (item.task_id === currentTaskId) {
                return {
                    ...item,
                    analysis_state: analysisState
                }
            }
            return item;
        });
        setTaskList(changeTaskList);
    }, [analysisState])

    const [btnLoading, setBtnLoading] = useState(false);

    return (
        <Row style={{width: "100%"}}>
            <Space align={"center"}>
                {commentsTotal === 0 ? (
                    <h2>暂未收集评论</h2>
                ) : (
                    <Row>
                        {/* {platformIconMap[currentPlatform]} */}<h2>&nbsp;{currentKeyWord}&nbsp;{commentsTotal}条</h2>
                    </Row>
                )}
                <InputAdornment prepend="我的产品/服务/品牌是" style={{width: "420px", marginLeft: "10px"}}>
                    <Input
                        placeholder="请输入"
                        value={inputValues[currentTaskId] || ''}
                        onChange={(value) => handleInputChange(currentTaskId, value)}
                    />
                </InputAdornment>
                <Button
                    style={{marginLeft: "10px"}}
                    onClick={async () => {
                        // determine action
                        if (progress === 100) {
                            if (activeMode === '2') {
                                handleDownload();
                            } else {
                                gotoReply();
                            }
                        } else {
                            handleAnalysis(currentTaskId);
                        }

                        // show spinner, wait 3s, then refresh task list via fetchTasks
                        try {
                            setBtnLoading(true);
                            await new Promise(r => setTimeout(r, 3000));
                            if (typeof fetchTasks === 'function') {
                                await fetchTasks();
                                const stored = localStorage.getItem('tasks');
                                if (stored) setTaskList(JSON.parse(stored));
                            }
                        } catch (e) {
                            console.error('Failed to refresh task list', e);
                        } finally {
                            setBtnLoading(false);
                        }
                    }}
                    disabled={!analysisAble || commentsTotal === 0}
                    loading={btnLoading}
                >
                    {!analysisAble ? '操作中' : (
                        analysisState === "finish" ? (activeMode === '2' ? '下载结果' : '前往私信') : (
                            analysisState === 'initial' ? '开始分析' : (
                                analysisState === 'stopped' ? '▶️ 继续分析' : '停止分析'
                            )
                        )
                    )}
                </Button>
            </Space>
        </Row>
    );
};

export default AnalysisHeader;
