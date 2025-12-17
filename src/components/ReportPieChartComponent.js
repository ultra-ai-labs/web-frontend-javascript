import React, { useEffect, useState } from 'react';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Row, Space } from "tdesign-react";

echarts.use([TitleComponent, TooltipComponent, LegendComponent, PieChart, CanvasRenderer]);

const SinglePieChart = ({ data, title, setChartOptions }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    const chartNameMap = {
        "情绪分析": "emotion",
        "购买意向": "purchaseIntention",
        "产品讨论": "productDiscussion",
        "疑问用户": "questionUsers"
    }

    useEffect(() => {
        const chartDom = document.getElementById(title);
        const myChart = echarts.init(chartDom);
        const option = {
            title: {
                text: `${total}`,
                subtext: '总数',
                left: '49%',
                top: '45%',
                textAlign: 'center',
                textStyle: {
                    fontSize: 25,
                    fontWeight: 'bold'
                },
                subtextStyle: {
                    fontSize: 20
                }
            },
            tooltip: {
                trigger: 'item'
            },
            legend: {
                orient: 'horizontal',
                bottom: '0%',
                data: data.map(item => item.name)
            },
            series: [
                {
                    name: '用户数据',
                    type: 'pie',
                    radius: ['35%', '50%'],
                    avoidLabelOverlap: true,
                    label: {
                        show: true,
                        formatter: '{b}\n{d}% 数量{c}',
                        position: 'outside',
                        textStyle: {
                            fontSize: 15
                        }
                    },
                    labelLine: {
                        show: true,
                        length: 10,
                        length2: 10
                    },
                    data: data.map(item => ({ value: item.value, name: item.name, itemStyle: { color: item.color } }))
                }
            ]
        };

        myChart.setOption(option);

        myChart.on('click', (params) => {
            let options = {};
            options.title = chartNameMap[title];
            options.name = params.name;
            setChartOptions(options);
        });

        return () => {
            myChart.dispose();
        };
        // eslint-disable-next-line
    }, [data, title]);

    return <div id={title} style={{ width: 600, height: 400 }}></div>;
};

const ReportPieChartComponent = ({ commentList, commentsTotal, PieDataList, taskId, setChartOptions }) => {
    const [emotionData, setEmotionData] = useState(PieDataList?.emotionData || []);
    const [purchaseIntentionData, setPurchaseIntentionData] = useState(PieDataList?.purchaseIntentionData || []);
    const [productDiscussionData, setProductDiscussionData] = useState(PieDataList?.productDiscussionData || []);
    const [questionUsersData, setQuestionUsersData] = useState(PieDataList?.questionUsersData || []);

    const processComments = (comment_list) => {
        const total_comments = comment_list.length;

        const positive_comments = comment_list.filter(comment => comment.情绪分析 === '正向').length;
        const neutral_comments = comment_list.filter(comment => comment.情绪分析 === '中性').length;
        const negative_comments = comment_list.filter(comment => comment.情绪分析 === '负向').length;

        const purchase_intention = comment_list.filter(comment => comment.意向客户 === '是').length;
        const mention_product = comment_list.filter(comment => comment.提及产品 === '是').length;
        const question_users = comment_list.filter(comment => comment.疑问点 && comment.疑问点 !== '没有').length;

        const newEmotionData = [
            {
                value: neutral_comments,
                name: '中性',
                color: '#FF9800',
                percentage: ((neutral_comments / total_comments) * 100).toFixed(2) + '%'
            },
            {
                value: positive_comments,
                name: '正向',
                color: '#4CAF50',
                percentage: ((positive_comments / total_comments) * 100).toFixed(2) + '%'
            },
            {
                value: negative_comments,
                name: '负向',
                color: '#F44336',
                percentage: ((negative_comments / total_comments) * 100).toFixed(2) + '%'
            }
        ];
        const newPurchaseIntentionData = [
            {
                value: purchase_intention,
                name: '购买意向',
                color: '#0088FE',
                percentage: ((purchase_intention / total_comments) * 100).toFixed(2) + '%'
            },
            {
                value: total_comments - purchase_intention,
                name: '其他',
                color: '#00C49F',
                percentage: (((total_comments - purchase_intention) / total_comments) * 100).toFixed(2) + '%'
            }
        ];
        const newProductDiscussionData = [
            {
                value: mention_product,
                name: '产品讨论',
                color: '#0088FE',
                percentage: ((mention_product / total_comments) * 100).toFixed(2) + '%'
            },
            {
                value: total_comments - mention_product,
                name: '其他',
                color: '#00C49F',
                percentage: (((total_comments - mention_product) / total_comments) * 100).toFixed(2) + '%'
            }
        ];
        const newQuestionUsersData = [
            {
                value: question_users,
                name: '疑问用户',
                color: '#0088FE',
                percentage: ((question_users / total_comments) * 100).toFixed(2) + '%'
            },
            {
                value: total_comments - question_users,
                name: '其他',
                color: '#00C49F',
                percentage: (((total_comments - question_users) / total_comments) * 100).toFixed(2) + '%'
            }
        ];

        setEmotionData(newEmotionData);
        setPurchaseIntentionData(newPurchaseIntentionData);
        setProductDiscussionData(newProductDiscussionData);
        setQuestionUsersData(newQuestionUsersData);

        // Save to localStorage
        if (!localStorage.getItem(`${taskId}-PieData`))//TODO:解耦
            localStorage.setItem(`${taskId}-PieData`, JSON.stringify({
                emotionData: newEmotionData,
                purchaseIntentionData: newPurchaseIntentionData,
                productDiscussionData: newProductDiscussionData,
                questionUsersData: newQuestionUsersData
            }));
    };

    useEffect(() => {
        if (commentList.length > 0 && commentList.length === commentsTotal && !PieDataList) {
            processComments(commentList);
        }
        // eslint-disable-next-line
    }, [commentList]);

    useEffect(() => {
        if (PieDataList) {
            setEmotionData(PieDataList.emotionData || []);
            setPurchaseIntentionData(PieDataList.purchaseIntentionData || []);
            setProductDiscussionData(PieDataList.productDiscussionData || []);
            setQuestionUsersData(PieDataList.questionUsersData || []);
        }
    }, [PieDataList]);

    return (
        <Space>
            <Row>
                <Space>
                    <h2 style={{ marginRight: "-100px" }}>情绪分析</h2>
                    <SinglePieChart data={emotionData} title="情绪分析" style={{ marginTop: '-500px' }} setChartOptions={setChartOptions} />
                </Space>
                <Space>
                    <h2 style={{ marginRight: "-100px" }}>购买意向</h2>
                    <SinglePieChart data={purchaseIntentionData} title="购买意向" setChartOptions={setChartOptions} />
                </Space>
            </Row>
            <Row>
                <Space>
                    <h2 style={{ marginRight: "-100px" }}>产品讨论</h2>
                    <SinglePieChart data={productDiscussionData} title="产品讨论" setChartOptions={setChartOptions} />
                </Space>
                <Space>
                    <h2 style={{ marginRight: "-100px" }}>疑问用户</h2>
                    <SinglePieChart data={questionUsersData} title="疑问用户" setChartOptions={setChartOptions} />
                </Space>
            </Row>
        </Space>
    );
}

export default ReportPieChartComponent;
