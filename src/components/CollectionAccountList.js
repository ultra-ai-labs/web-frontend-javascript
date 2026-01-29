import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Table, Tag, Pagination, Row, Space } from "tdesign-react";
import { ChevronLeftIcon, ChevronRightIcon } from 'tdesign-icons-react';
import { getAccountListApi } from "../api/api";
import dyIcon from '../public/dy.svg';
import xhsIcon from '../public/xhs.svg';

const AccountList = () => {
    const [accountData, setAccountData] = useState([]);
    const allAccountData = useRef([]);
    const [total, setTotal] = useState(0);

    // 添加滚动容器的引用
    const scrollContainerRef = useRef(null);

    // 处理滚动的函数
    const handleScroll = (direction) => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollAmount = 200; // 每次滚动的距离
            const newScrollLeft = container.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
            container.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    // 使用 useMemo 统计用户名出现次数并排序
    const accountNumList = useMemo(() => {
        const countMap = allAccountData.current.reduce((acc, curr) => {
            acc[curr.username] = (acc[curr.username] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(countMap)
            .map(([username, num]) => ({
                username,
                num
            }))
            .sort((a, b) => b.num - a.num); // 按数量从大到小排序
        // eslint-disable-next-line
    }, [allAccountData.current]);

    useEffect(() => {
        getAccountListApi().then(response => {
            const formattedData = response.data.map((item, index) => ({
                key: index + 1,
                keyword: item.keyword,
                platform: item.platform,
                username: item.username,
                createTime: new Date(item.create_time).toLocaleString('zh-CN', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                marketState: item.market_state,
                analysisState: item.analysis_state,
                commentCount: item.crawler_progress || 0,
                analysisCount: item.analysis_progress || 0,
                intentionCount: item.market_progress || 0
            }));
            allAccountData.current = formattedData;
            setTotal(formattedData.length);
            handlePageChange({ current: 1, pageSize: 10 });
        });
        // eslint-disable-next-line
    }, []);

    const platformIconMap = {
        'dy': <img src={dyIcon} alt="抖音" style={{ width: '20px', height: '20px' }} />,
        'xhs': <img src={xhsIcon} alt="小红书" style={{ width: '20px', height: '20px' }} />
    };

    const columns = [
        {
            title: "用户名",
            align: "center",
            colKey: "username",
            cell: ({ row }) => (
                <Tag theme="default" variant="light">
                    {row.username}
                </Tag>
            ),
            width: "100px"
        },
        {
            title: "关键词",
            align: "center",
            colKey: "keyword",
            cell: ({ row }) => (
                <Tag theme="success" variant="light">
                    {row.keyword}
                </Tag>
            ),
            width: "200px"
        },
        // {
        //     title: "平台",
        //     align: "center",
        //     colKey: "platform",
        //     cell: ({ row }) => {
        //         return (
        //             <Space>
        //                 {platformIconMap[row.platform]}
        //             </Space>
        //         );
        //     }
        // },
        {
            title: "创建时间",
            align: "center",
            colKey: "createTime",
        },
        {
            title: "任务状态",
            align: "center",
            colKey: "marketState",
            cell: ({ row }) => {
                const getStateAndTheme = () => {
                    if (row.marketState === 'finish') {
                        return { state: '已私信', theme: 'success' };
                    } else if (row.marketState === 'running' || row.analysisState === 'finish') {
                        return { state: '已分析', theme: 'primary' };
                    } else {
                        return { state: '未分析', theme: 'warning' };
                    }
                };

                const { state, theme } = getStateAndTheme();
                return (
                    <Tag theme={theme} variant="light">
                        {state}
                    </Tag>
                );
            }
        },
        {
            title: "评论数量",
            align: "center",
            colKey: "commentCount",
        },
        {
            title: "分析数量",
            align: "center",
            colKey: "analysisCount",
        },
        {
            title: "意向数量",
            align: "center",
            colKey: "intentionCount",
        },
    ];

    const handlePageChange = useCallback((pageInfo) => {
        const { current: page, pageSize: size } = pageInfo;

        const start = (page - 1) * size;
        const end = start + size;
        setAccountData(allAccountData.current.slice(start, end));
    }, [allAccountData]);

    return (
        <Row justify="space-between" align="right" style={{ marginTop: '1vh', width: '100%' }}>
            <Space align="center" style={{ marginBottom: '10px' }} >
                {/*<h2 style={{ margin: 0 }}>活跃会员</h2>*/}
                <Space align="center">
                    <ChevronLeftIcon
                        className="hover-pointer"
                        onClick={() => handleScroll('left')}
                        style={{
                            cursor: 'pointer',
                            color: '#0052d9'
                        }}
                    />
                    <div
                        ref={scrollContainerRef}
                        style={{
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            position: 'relative',
                        }}
                    >
                        <Space style={{ display: 'inline-flex' }}>
                            {accountNumList.map((item, index) => (
                                <Tag
                                    key={index}
                                    theme="warning"
                                    variant="outline"
                                >
                                    {item.username}-{item.num}次
                                </Tag>
                            ))}
                        </Space>
                    </div>
                    <ChevronRightIcon
                        className="hover-pointer"
                        onClick={() => handleScroll('right')}
                        style={{
                            cursor: 'pointer',
                            color: '#0052d9'
                        }}
                    />
                </Space>

            </Space>
            <Table
                data={accountData}
                columns={columns}
                rowKey="key"
                tableLayout="auto"
                bordered
                size="medium"
                verticalAlign="middle"
                pagination={false}
            />
            <Pagination
                total={total}
                style={{ marginTop: '10px', width: "40%" }}
                showPageNumber
                showPageSize
                onChange={(pageInfo) => handlePageChange(pageInfo)}
                showJumper
                pageSizeOptions={[5, 10, 20]}
            />
        </Row>
    );
};

export default AccountList;
