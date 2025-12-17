import React, {useEffect, useRef, useState} from 'react';
import * as echarts from 'echarts/core'; // 按您的要求进行引入
import {BarChart} from 'echarts/charts';
import {TitleComponent, TooltipComponent, GridComponent, LegendComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';

// 按需注册组件
echarts.use([TitleComponent, TooltipComponent, GridComponent, LegendComponent, BarChart, CanvasRenderer]);

const BarChartComponent = ({commentList, commentsTotal, taskId}) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    const [provinceData, setProvinceData] = useState(() => {
        const storedData = localStorage.getItem(`${taskId}-provinceData`);
        return storedData ? JSON.parse(storedData) : [];
    });

    useEffect(() => {
        if (commentList && commentList.length > 0 && commentList.length === commentsTotal) {
            const newProvinceData = commentList.reduce((acc, item) => {
                const province = item['IP地址'];
                if (province) {
                    const existingProvince = acc.find(data => data.province === province);
                    if (existingProvince) {
                        existingProvince.count += 1;
                    } else {
                        acc.push({province, count: 1});
                    }
                }
                return acc;

            }, []);

            setProvinceData(newProvinceData);
            localStorage.setItem(`${taskId}-provinceData`, JSON.stringify(newProvinceData));
        }
        // eslint-disable-next-line
    }, [commentList, taskId]);

    useEffect(() => {
        if (!chartInstance.current) {
            chartInstance.current = echarts.init(chartRef.current);
        }

        const option = {
            title: {
                text: '用户IP省份分布',
                left: 'center',
                textStyle: {
                    fontSize: 25,
                },
            },
            tooltip: {
                trigger: 'axis',
            },

            xAxis: {
                type: 'category',
                data: provinceData.map(item => item.province),
            },
            yAxis: {
                type: 'value',
            },
            series: [
                {
                    name: '数量',
                    type: 'bar',
                    data: provinceData.map(item => item.count),
                    barWidth: 20,
                    itemStyle: {
                        color: '#409EFF'
                    },
                    label: {
                        show: true,          // 显示标签
                        position: 'top',     // 标签位置在柱状图顶部
                        fontSize: 12,        // 标签文字大小
                        color: '#000',       // 标签文字颜色
                    },
                },
            ],
        };

        chartInstance.current.setOption(option);

        return () => {
            if (chartInstance.current) {
                chartInstance.current.dispose();
                chartInstance.current = null;
            }
        };
    }, [provinceData]);

    return <div ref={chartRef} style={{width: '100%', height: '400px', padding: '10px'}}/>;
};

export default BarChartComponent;
