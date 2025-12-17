import React, { useState } from 'react';
import { Table, Tag, Pagination, Button, Row, Col } from 'tdesign-react';

export default function SubscriptionRecords() {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);

    const columns = [
        {
            title: '订阅套餐',
            colKey: 'package',
        },
        {
            title: '是否到期',
            colKey: 'status',
            cell: ({ row }) => (
                row.status === '使用中' ? (
                    <Tag theme="success" variant="light">使用中</Tag>
                ) : (
                    <Tag theme="default" variant="light">已过期</Tag>
                )
            ),
        },
        {
            title: '充值时间',
            colKey: 'date',
        },
        {
            title: '操作',
            colKey: 'action',
            cell: () => (
                <a href="#" style={{ color: '#0052D9' }}>续订</a>
            ),
        },
    ];

    const data = [
        { package: '企业年度订阅', status: '使用中', date: '25-08-13' },
        { package: '企业月度订阅', status: '已过期', date: '24-06-04' },
        { package: '10万条评论额度券', status: '使用中', date: '24-09-01' },
        { package: '企业月度订阅', status: '已过期', date: '24-05-01' },
        { package: '企业月度订阅', status: '已过期', date: '24-04-01' },
        { package: '企业月度订阅', status: '已过期', date: '24-03-01' },
        // 这里可以继续添加数据
    ];

    return (
        <div style={{ padding: '10px' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: '10px' }}>
                <Col>
                    <h1>订阅记录</h1>
                </Col>
                <Col>
                    <Button>返回</Button>
                </Col>
            </Row>
            <Table
                bordered
                data={data}
                columns={columns}
                rowKey="index"
                pagination={false}
            />
            <Pagination
                current={currentPage}
                pageSize={[5, 10, 20]}
                total={47}
                onChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(size) => setPageSize(size)}
            />
        </div >
    );
}
