import React, {useEffect} from 'react';
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
                            setTaskList
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

    return (
        <Row style={{width: "100%"}}>
            <Space align={"center"}>
                {commentsTotal === 0 ? (
                    <h2>暂未收集评论</h2>
                ) : (
                    <Row>
                        {platformIconMap[currentPlatform]}<h2>&nbsp;{currentKeyWord}&nbsp;{commentsTotal}条</h2>
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
                    // onClick={progress === 100 ? handleDownload : () => handleAnalysis(currentTaskId)}
                    onClick={progress === 100 ? activeMode === '2' ? handleDownload : gotoReply : () => handleAnalysis(currentTaskId)}
                    disabled={!analysisAble || commentsTotal === 0}
                >
                    {/*{!analysisAble ? '操作中' : (analysisState === "finish" ? '下载结果' : (analysisState === 'initial' ? '开始分析' : '停止分析'))}*/}
                    {!analysisAble ? '操作中' : (analysisState === "finish" ? activeMode === '2' ? '下载结果' : '前往私信' : (analysisState === 'initial' ? '开始分析' : '停止分析'))}
                </Button>
            </Space>
        </Row>
    );
};

export default AnalysisHeader;
