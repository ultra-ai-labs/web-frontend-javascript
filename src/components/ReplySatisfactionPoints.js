import React, {useState, useEffect} from 'react';
import {Collapse, Loading, Space, Tag} from 'tdesign-react';
import CollapsePanel from 'tdesign-react/es/collapse/CollapsePanel';
import {postAnalysisSatisfactionApi} from '../api/api';

const ReplySatisfactionPoints = ({taskId}) => {
    const [satisfactionData, setSatisfactionData] = useState([]);
    const [questionData, setQuestionData] = useState([]);
    const [dissatisfactionData, setDissatisfactionData] = useState([]);
    const [questionPublic, setQuestionPublic] = useState([]);
    const [dissatisfactionPublic, setDissatisfactionPublic] = useState([]);

    const [isLoading, setIsLoading] = useState(false);

    // 从 API 获取数据
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const {data} = await postAnalysisSatisfactionApi({task_id: taskId});

                // 设置满意点、疑问点、不满点
                setSatisfactionData(data.满意点.points || []);
                setQuestionData(data.疑问点.points || []);
                setDissatisfactionData(data.不满点.points || []);

                // 设置疑问点和不满点的公关建议
                setQuestionPublic(data.疑问点.suggestions || []);
                setDissatisfactionPublic(data.不满点.suggestions || []);
                setIsLoading(false)
            } catch (error) {
                console.error('获取数据失败', error);
            }
        };

        fetchData();
    }, [taskId]);


    // 去除 title 前缀
    const cleanTitle = (title) => {
        // 去除"不满点1"、"疑问点2"、"满意点3" 这种格式，保留 "1. 产品质量差"
        return title.replace(/(满意点|疑问点|不满点)\d+/g, '').trim();
    };


    // 渲染面板
    const renderCollapsePanels = (data, backgroundColor) => {
        return data.map((point, index) => (
            <CollapsePanel key={index + 1} header={cleanTitle(point.title)}>
                <div style={{backgroundColor, padding: '5px', borderRadius: '3px'}}>
                    {point.comments && point.comments.map((comment, idx) => (
                        <p key={idx}>{comment}</p>
                    ))}
                </div>
            </CollapsePanel>
        ));
    };

    // 渲染公关建议
    const renderPublicRelationsSuggestion = (suggestions, backgroundColor) => {
        if (suggestions.length === 0) return null;
        return (
            <CollapsePanel key="pr" header={<span style={{color: '#405DF9'}}>公关建议</span>}>
                <div style={{backgroundColor, padding: '5px', borderRadius: '3px'}}>
                    {suggestions.map((suggestion, index) => (
                        <p key={index}>{suggestion}</p>
                    ))}
                </div>
            </CollapsePanel>
        );
    };

    return (
        <Loading loading={isLoading} text="拼命加载中..." size="small">
            <Space direction="vertical">
                <Space align="center">
                    <h2 style={{width: '70px'}}>满意点</h2>
                    <Space>
                        {satisfactionData.map((point, index) => (
                            <Tag key={index} theme="success" variant="light-outline" style={{cursor: 'pointer'}}>
                                {point.title}
                            </Tag>
                        ))}
                    </Space>
                </Space>
                <Collapse defaultActiveKey={['1']} borderless>
                    {renderCollapsePanels(satisfactionData, '#DFF0D8')}
                </Collapse>

                <Space align="center">
                    <h2 style={{width: '70px'}}>疑问点</h2>
                    <Space breakLine>
                        {questionData.map((point, index) => (
                            <Tag key={index} theme="primary" variant="light-outline" style={{cursor: 'pointer'}}>
                                {point.title}
                            </Tag>
                        ))}
                    </Space>
                </Space>
                <Collapse defaultActiveKey={['1']} borderless>
                    {renderCollapsePanels(questionData, '#CCE5FF')}
                    {renderPublicRelationsSuggestion(questionPublic, '#CCE5FF')}
                </Collapse>

                <Space align="center">
                    <h2 style={{width: '70px'}}>不满点</h2>
                    <Space breakLine>
                        {dissatisfactionData.map((point, index) => (
                            <Tag key={index} theme="warning" variant="light-outline" style={{cursor: 'pointer'}}>
                                {point.title}
                            </Tag>
                        ))}
                    </Space>
                </Space>
                <Collapse defaultActiveKey={['1']} borderless>
                    {renderCollapsePanels(dissatisfactionData, '#FFF3CD')}
                    {renderPublicRelationsSuggestion(dissatisfactionPublic, '#FFF3CD')}
                </Collapse>
            </Space>
        </Loading>
    );
};

export default ReplySatisfactionPoints;
