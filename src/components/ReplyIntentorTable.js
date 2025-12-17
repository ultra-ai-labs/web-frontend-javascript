import React, { useState, useEffect } from 'react';
import { Table, Pagination, Tag, Space, Col, Row, Tooltip, Divider, Dropdown, MessagePlugin, DateRangePickerPanel } from 'tdesign-react';
import { getMarketListByTaskIdApi, getXhsApi, updateMarketingUserApi } from "../api/api";
import QRCode from "qrcode.react";

const IntentorTable = ({ userLinkList, total, curMarketingTaskId, taskId, platform, setOptions }) => {
    const [userRegion, setUserRegion] = useState('全选');//选中的地区
    const [dateRange, setDateRange] = useState([]);//选中的日期
    const [regionOptions, setRegionOptions] = useState([]);//地区选项
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(total);//筛选的表长度
    const [userList, setUserList] = useState([]);//展示的表
    const [sumData, setSumData] = useState([]);//总表，只根据userLinkList变化
    const [isUserListUpdated, setIsUserListUpdated] = useState(false);//是否被用户手动改过意向表

    const [filterValue, setFilterValue] = useState({
        time: [],
        region: [],
    });

    const columns = [
        { title: '意向用户列表', colKey: 'nickname', width: '200px' },
        {
            title: '用户地区', colKey: 'region',
            filter: {
                type: 'multiple',
                resetValue: [],
                list: regionOptions,
                // 是否显示重置取消按钮，一般情况不需要显示
                showConfirmAndReset: true,
            }, width: '120px'
        },
        {
            title: '评论时间', colKey: 'time',
            filter: {
                // todo(type): 类型缺陷
                type: 'custom',
                component: DateRangePickerPanel,
                props: {
                    firstDayOfWeek: 7,
                },
                style: {
                    fontSize: '14px',
                },
                classNames: 'custom-class-name',
                attrs: {
                    'data-type': 'DateRangePickerPanel',
                },
                // 是否显示重置取消按钮，一般情况不需要显示
                showConfirmAndReset: true,
                // 日期范围是一个组件，重置时需赋值为 []
                resetValue: [],
            },
            width: '120px'
        },
        { title: '评论内容', colKey: 'comment', width: 'auto' },
        {
            title: '是否私信', colKey: 'privateMessage',
            cell: ({ row }) => {
                return (
                    row.privateMessage === '已私信' ?
                        <Tag variant="outline" theme="success">
                            <p id={row.comment_id}>已私信</p></Tag> :
                        <Dropdown
                            options={[{ content: '移出意向列表', value: 1, }, {
                                content: '设置为已私信',
                                value: 2,
                            }, { content: '设置为未私信', value: 3, }]}
                            onClick={(option) => clickHandler(option, row)}>
                            <Tag variant="outline" theme="warning">
                                <p>{row.privateMessage !== null ? row.privateMessage : '未私信'}</p>
                            </Tag>
                        </Dropdown>
                )
            }
        }
    ];

    useEffect(() => {
        setOptions({ "ip_location": userRegion, ...convertToTimestampRange(dateRange) })
        // eslint-disable-next-line
    }, [userRegion, dateRange]);

    const request = (filters) => {
        const timer = setTimeout(() => {
            clearTimeout(timer);
            // 应用筛选条件
            const filteredData = sumData.filter((item) => {
                let result = true;
                if (result && filters.region && filters.region.length) {
                    result = filters.region.includes(item.region);
                }
                if (result && filters.time && filters.time.length) {
                    const itemDate = new Date(item.time);
                    const [startDate, endDate] = filters.time;
                    let startD = new Date(startDate)
                    let endD = new Date(endDate)
                    // 检查日期是否在选定的范围内
                    result = itemDate >= startD && itemDate <= endD;
                }
                return result;
            });

            // 计算当前页的数据
            const start = (currentPage - 1) * pageSize;
            const end = start + pageSize;
            setUserList(filteredData.slice(start, end));
        }, 100);
    };

    const onFilterChange = (filters, col) => {
        console.log(filters, col);
        setFilterValue({
            ...filters,
            time: filters.time || [],
            region: filters.region || [],
        });
        // 在此处理过滤数据效果，以达到更真实的过滤效果
        request(filters);
    };


    //转换日期为unix时间戳
    const convertToTimestampRange = (dates) => {
        const [startDate, endDate] = dates;
        // 将日期字符串解析为 Date 对象
        const startTimestamp = new Date(`${startDate}-01T00:00:00Z`).getTime() / 1000; // 获取 start 时间的秒级时间戳
        const endTimestamp = new Date(`${endDate}-01T23:59:59Z`).getTime() / 1000;   // 获取 end 时间的秒级时间戳

        return {
            "start_time": Math.floor(startTimestamp),
            "end_time": Math.floor(endTimestamp)
        };
    }


    useEffect(() => {
        if (userLinkList && userLinkList.length !== 0) {
            // userLinkList.forEach(item=>console.log(item.私信结果))
            const formattedData = formatData(userLinkList)
            setSumData(formattedData);

            const regionCount = formattedData.reduce((acc, item) => {
                acc[item.region] = (acc[item.region] || 0) + 1;
                return acc;
            }, {});

            const sortedRegions = Object.keys(regionCount).sort((a, b) => {
                if (a === "IP未知") return 1;
                if (b === "IP未知") return -1;
                return regionCount[b] - regionCount[a];
            });

            const formattedRegions = sortedRegions.map(region => ({
                label: `${region}-${regionCount[region]}人`,
                value: region
            }));
            setRegionOptions([{ label: '全部地区', value: '全选' }, ...formattedRegions]);

            setTotalItems(formattedData.length);
            const start = (currentPage - 1) * pageSize;
            const end = start + pageSize;
            setUserList(formattedData.slice(start, end));
        } else {
            setUserList([])
        }
        // eslint-disable-next-line
    }, [userLinkList]);

    useEffect(() => {//userLinkList改变时，对应修改存储的region和date range
        if (sumData.length > 0) {
            const tempUserRegion = localStorage.getItem(`${taskId}-region`) || '全选'
            const tempDateRange = JSON.parse(localStorage.getItem(`${taskId}-date`)) || []
            setUserRegion(tempUserRegion);
            setDateRange(tempDateRange)
        }
        // eslint-disable-next-line
    }, [sumData]);

    useEffect(() => {//页码有变化立即重新获取
        if ((curMarketingTaskId && curMarketingTaskId.length > 0 && curMarketingTaskId.includes(taskId)) || isUserListUpdated) {
            getUserList()
        }
        // eslint-disable-next-line
    }, [curMarketingTaskId, currentPage, pageSize, isUserListUpdated]);

    useEffect(() => {
        setCurrentPage(1);
    }, [taskId]);

    const formatData = (data) => {//把后端的user_link_list格式化
        return data.map((item, index) => ({
            key: index,
            nickname: platform === 'xhs'
                ?
                <Tooltip content={
                    <div align={"center"}>
                        <span style={{ fontSize: "18px" }}>小红书扫码私信</span>
                        <Divider layout={"horizontal"} style={{ margin: "10px 5px" }} />
                        <QRCode value={item.user_link} size={128} /></div>
                } theme="light">
                    <a href={item.user_link} target="_blank" rel="noreferrer">{item.用户昵称}</a>
                </Tooltip>
                : <a href={item.user_link} target="_blank" rel="noreferrer">{item.用户昵称}</a>,
            region:
                item.IP地址 === "" || item.IP地址 === "IP未知" ? "IP未知" : item.IP地址,
            comment: platform === 'xhs'
                ? <a href={`#${index}`} onClick={(e) => handleLinkClick(e, item.内容链接)}>{item.评论内容}</a>
                : <a href={item.内容链接} target="_blank" rel="noreferrer">{item.评论内容}</a>,
            privateMessage: item.私信结果,
            time: item.评论时间,
            comment_id: item.comment_id
        }));
    }

    //处理xhs的链接跳转
    const handleLinkClick = async (e, originalLink) => {
        e.preventDefault(); // 阻止默认的打开行为
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

    const getUserList = async () => {//重新获取当前页码的userLinkList
        let offset = (currentPage - 1) * pageSize
        await getMarketListByTaskIdApi(taskId, offset, pageSize)
            .then(data => {
                if (data && data.user_link_list) {
                    const formattedData = formatData(data.user_link_list)
                    setUserList(formattedData)
                }
            }).catch(err => console.error(err))
    }

    const handlePageChange = (newPage, newPageSize) => {
        setCurrentPage(newPage);
        setPageSize(newPageSize);

        // 如果有筛选条件，对sumData进行筛选
        let filteredData = sumData;
        if (filterValue.region && filterValue.region.length) {
            filteredData = filteredData.filter(item => filterValue.region.includes(item.region));
        }
        if (filterValue.time && filterValue.time.length) {
            filteredData = filteredData.filter(item => {
                const itemDate = new Date(item.time);
                const [startDate, endDate] = filterValue.time;
                return itemDate >= startDate && itemDate <= endDate;
            });
        }

        // 计算分页
        const start = (newPage - 1) * newPageSize;
        const end = start + newPageSize;
        setUserList(filteredData.slice(start, end));
        setTotalItems(filteredData.length);
    };



    const clickHandler = async (option, row) => {//"未私信"客户的处理
        let back_data = {
            task_id: taskId,
            platform,
            comment_id: row.comment_id
        }
        if (option.value === 1) {
            back_data = {
                ...back_data,
                intent_customer: '否'
            }
        } else {
            if (option.value === 2) {
                back_data = {
                    ...back_data,
                    market_result: '已私信'
                }
            }

            if (option.value === 3) {
                back_data = {
                    ...back_data,
                    market_result: '未私信'
                }
            }
        }

        // console.log(option.value,back_data)
        await updateMarketingUserApi(back_data).then(data => {
            if (data.status === 200) {
                getUserList().then(data => {
                    setIsUserListUpdated(true);
                    MessagePlugin.success('操作成功')
                }
                )
            }
        })
    }

    return (
        <Space direction='vertical' style={{ width: "98%" }}>
            <Row direction='horizontal' align='center' style={{ width: "100%" }}>

                <Col flex="auto">
                    <Pagination
                        style={{ marginLeft: "10px" }}
                        total={totalItems}
                        pageSize={pageSize}
                        current={currentPage}
                        onChange={(pageInfo) => handlePageChange(pageInfo.current, pageInfo.pageSize)}
                        showJumper
                        pageSizeOptions={[10, 20]}
                    />
                </Col>
            </Row>
            <Table columns={columns} data={userList} bordered style={{ width: "100%" }} rowKey={"comment_id"}
                filterValue={filterValue}
                // defaultFilterValue={filterValue}
                onFilterChange={onFilterChange}
                maxHeight={1000} />
        </Space>
    );
};

export default IntentorTable;
