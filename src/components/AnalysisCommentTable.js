// src/components/AnalysisCommentTable.js
import React, { useEffect, useState, useRef } from 'react';
import { PrimaryTable, Tag, Space, Dropdown, MessagePlugin } from 'tdesign-react';
import { batchUpdateMarketingUserApi } from '../api/api';

const AnalysisCommentTable = ({
    comments,
    currentTaskId,
    activeMode,
    allComments,
    platform,
    userSubscribeInfo,
    handleLinkClick,
    getAllComments,
    searchTerm,
    setSearchTerm,
    emotionFilterValue
}) => {

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [data, setData] = useState([]);
    const processedComments = data.map((comment, index) => {
        // 处理评论内容和用户昵称链接
        let commentContent = platform.current === 'xhs'
            ? <a href={`#${index}`} onClick={(e) => handleLinkClick(e, comment.内容链接)}>{comment.评论内容}</a>
            : <a href={comment.内容链接} target="_blank" rel="noreferrer">{comment.评论内容}</a>;

        let userNickname = <a href={comment.用户链接} target="_blank" rel="noreferrer">{comment.用户昵称}</a>;

        // 如果是试用会员且超过页数限制，则不显示链接
        if (userSubscribeInfo.package_type === '试用会员') {
            commentContent = <span>{comment.评论内容}</span>;
            userNickname = <span>{comment.用户昵称}</span>;
        }
        const currentIntent = comment.intent_customer || comment['意向客户'];
        return {
            index: index + 1,
            评论时间: comment.评论时间,
            用户昵称: userNickname,
            IP地址: comment.IP地址,
            评论内容: commentContent,
            buttonText: "测试",
            intent_customer: currentIntent
                ? <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Dropdown
                        options={[
                            { content: '高意向', value: '是' },
                            { content: '潜在客', value: '不确定' },
                            { content: '无意向', value: '否' }
                        ]}
                        onClick={(option) => {
                            intentChangeHandler(option, comment);
                        }}>
                        <Tag
                            theme={currentIntent === "是" ? "success" : currentIntent === "不确定" ? "warning" : "default"}
                            variant={currentIntent === "是" ? 'dark' : 'outline'}>
                            {currentIntent === "是" ? "高意向" : currentIntent === "不确定" ? "潜在客" : "无意向"}
                        </Tag>
                    </Dropdown>
                </div>
                : '',
            分析理由: comment.分析理由 || '',
            情绪分析: comment.情绪分析
                ? <Tag
                    theme={
                        comment.情绪分析 === "正向" ? "success" :
                            comment.情绪分析 === "负向" ? "danger" :
                                "default"
                    }
                    variant={'outline'}
                >
                    {comment.情绪分析}
                </Tag>
                : '',
            提及产品: comment.提及产品 || '',
            满意点: comment.满意点 || '',
            不满点: comment.不满点 || '',
            疑问点: comment.疑问点 || '',
            id: comment.id,
            comment_id: comment.comment_id
        };
    })
    const [filterValue, setFilterValue] = useState({});
    const isFilter = useRef(false);

    useEffect(() => {
        if (Object.keys(filterValue).length === 0 ||
            (filterValue.评论内容 && filterValue.评论内容 === '') ||
            (filterValue.intent_customer && filterValue.intent_customer.length === 0) ||
            (filterValue.情绪分析 && filterValue.情绪分析.length === 0)) {
            isFilter.current = false
        } else {
            isFilter.current = true
        }
    }, [allComments, comments, filterValue])

    useEffect(() => {
        setData(allComments)
        request(filterValue)
        // eslint-disable-next-line
    }, [allComments])


    const request = (filters) => {
        const timer = setTimeout(() => {
            clearTimeout(timer);
            const newData = allComments.filter((item) => {
                let result = true;
                if (result && filters.评论内容) {
                    result = String(item.评论内容).indexOf(filters.评论内容) !== -1;
                }

                if (result && filters.intent_customer && filters.intent_customer.length) {
                    result = filters.intent_customer.includes(item.intent_customer);
                }

                if (result && filters.情绪分析 && filters.情绪分析.length) {
                    result = filters.情绪分析.includes(item.情绪分析);
                }
                return result;
            });
            setData(newData);
        }, 100);
    };
    const onFilterChange = (filters, col) => {
        // console.log(filters, col);
        setFilterValue({
            ...filters,
        });
        // 在此处理过滤数据效果，以达到更真实的过滤效果
        request(filters);
    };
    const onChange = (info, context) => {
        // console.log('onChange', info, context);
    };

    const intentChangeHandler = async (option, comment) => {
        // 检查是否有选中的行
        if (selectedRowKeys.length > 0) {
            const comments_data = selectedRowKeys.map(id => ({
                id,
                intent_customer: option.value,
            }));

            const back_data = {
                platform: platform.current,
                comments_data
            };

            try {
                const result = await batchUpdateMarketingUserApi(back_data);
                if (result.status === 200) {
                    getAllComments();
                    setSelectedRowKeys([]); // 清空选中的行
                    MessagePlugin.success('批量更新成功');
                }
            } catch (error) {
                console.error('批量更新失败:', error);
                MessagePlugin.error('批量更新失败');
            }
        }
    };

    // const getButtonLabel = (row) => {
    //     if (buttonStatus[row.comment_id] === 'testing') {
    //         return '正在测试';
    //     }
    //     return row.意向客户 ? '再次测试' : '测试单条';
    // };
    //
    // const TableHeader = ({ searchTerm, onSearchChange }) => (
    //     <Space>
    //         <span>评论内容</span>
    //         <Input
    //             type="text"
    //             placeholder="搜索评论内容"
    //             value={searchTerm}
    //             onChange={onSearchChange}
    //             style={{ width: "150px" }}
    //             suffix={<SearchIcon />}
    //         />
    //     </Space>
    // );


    const column_simple = [
        { title: '序号', colKey: 'index', width: "90px" },
        { title: '评论时间', colKey: '评论时间', width: "120px" },
        { title: '用户昵称', colKey: '用户昵称', width: "150px" },
        { title: '用户省份', colKey: 'IP地址', width: "100px" },
        {
            title: '评论内容', colKey: '评论内容', filter: {
                type: 'input',
                resetValue: '',
                confirmEvents: ['onEnter'],
                props: {
                    placeholder: '输入关键词过滤',
                },
                showConfirmAndReset: true,
            }, width: "300px"
        },
        { title: '分析理由', colKey: '分析理由', width: "300px" },
        { title: '全选', colKey: 'row-select', type: 'multiple', width: 46 },
        {
            title: '意向客户', colKey: 'intent_customer', filter: {
                type: 'multiple',
                resetValue: [],
                list: [
                    {
                        label: '全选',
                        checkAll: true,
                    },
                    {
                        label: '高意向',
                        value: '是',
                    },
                    {
                        label: '潜在客',
                        value: '不确定',
                    },
                    {
                        label: '无意向',
                        value: '否',
                    },
                ],
                // 是否显示重置取消按钮，一般情况不需要显示
                showConfirmAndReset: true,
            }, width: "120px"
        },

        // {
        //     title: '操作',
        //     colKey: '操作',
        //     width: "120px",
        //     cell: ({ row }) => (
        //         <Tooltip
        //             content="测试填入的产品/服务名称分析效果"
        //             destroyOnClose
        //             showArrow
        //             theme="default"
        //         >
        //             <Button
        //                 theme="primary"
        //                 variant="base"
        //                 onClick={() => handleAnalysis(currentTaskId, row.comment_id)}
        //                 disabled={buttonStatus[row.comment_id] === 'testing'}
        //             >
        //                 {getButtonLabel(row)}
        //             </Button>
        //         </Tooltip>
        //
        //     ),
        // },
    ]
    const column_full = column_simple
        .filter(column => column.colKey !== '分析理由').concat([
            {
                title: '情绪分析',
                colKey: '情绪分析',
                width: "120px",
                filter: {
                    type: 'multiple',
                    resetValue: [],
                    list: [
                        {
                            label: '全选',
                            checkAll: true,
                        },
                        {
                            label: '中性',
                            value: '中性',
                        },
                        {
                            label: '正向',
                            value: '正向',
                        },
                        {
                            label: '负向',
                            value: '负向',
                        },
                    ],
                    showConfirmAndReset: true,
                }
            },
            { title: '提及产品', colKey: '提及产品', width: "100px" },
            { title: '满意点', colKey: '满意点', width: "120px" },
            { title: '不满点', colKey: '不满点', width: "120px" },
            { title: '疑问点', colKey: '疑问点', width: "120px" },
        ])

    const [columns, setColumns] = useState(column_simple)

    useEffect(() => {
        if (activeMode === '1') setColumns(column_simple)
        else if (activeMode === '2') setColumns(column_full)
        // eslint-disable-next-line
    }, [activeMode])

    useEffect(() => {
        if (searchTerm) setSearchTerm('')
        // eslint-disable-next-line
    }, [currentTaskId])

    useEffect(() => {
        if (emotionFilterValue) {
            const tempValue = { ...filterValue, 情绪分析: [emotionFilterValue] }
            request(tempValue)
            setFilterValue(tempValue)
        }
    }, [emotionFilterValue])

    return (
        <Space direction="vertical" style={{ position: 'relative' }}>
            <PrimaryTable
                style={{ marginBottom: "10px", overflowX: 'auto', maxWidth: '84vw' }}
                columns={columns}
                data={isFilter.current ? processedComments : comments}
                rowKey="id"
                maxHeight={1000}
                size="medium"
                tableLayout="fixed"
                verticalAlign="middle"
                resizable={true}
                filterValue={filterValue}
                onFilterChange={onFilterChange}
                onChange={onChange}
                selectedRowKeys={selectedRowKeys}
                onSelectChange={(val, context) => {
                    setSelectedRowKeys(val);
                }}

            // filterRow={null}
            // cell={({ colKey, row }) => {
            //     if (colKey === '操作') {
            //         return (
            //             <Tooltip
            //                 content="测试填入的产品/服务名称分析效果"
            //                 destroyOnClose
            //                 showArrow
            //                 theme="default"
            //             >
            //                 <Button
            //                     theme="primary"
            //                     variant="base"
            //                     onClick={() => handleAnalysis(row.task_id, row.comment_id)}
            //                     disabled={buttonStatus[row.comment_id] === 'testing'}
            //                 >
            //                     {getButtonLabel(row)}
            //                 </Button>
            //             </Tooltip>
            //         );
            //     }
            //     if (colKey === '意向客户') {
            //         return (
            //             <Tag theme={row[colKey] === "是" ? "primary" : "default"}>
            //                 {row[colKey]}
            //             </Tag>
            //         );
            //     }
            //     return row[colKey] || '';
            // }}
            />
        </Space>
    );
};

export default AnalysisCommentTable;
