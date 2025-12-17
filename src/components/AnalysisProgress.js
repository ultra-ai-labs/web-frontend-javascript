// src/components/AnalysisProgress.js
import React, { useEffect } from 'react';
import { Row, Col, Progress, Pagination, Input } from 'tdesign-react';
import { SearchIcon } from "tdesign-icons-react";

const AnalysisProgress = ({
    progressLabel,
    progress,
    clientNum,
    commentsTotal,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    onReply,
    taskId,
    searchTerm,
    handleSearchChange
}) => {

    useEffect(() => {
        setCurrentPage(1);
        // eslint-disable-next-line
    }, [taskId]);

    return (
        <Row style={{ width: '100%', alignItems: 'center' }}>
            <Col>
                {progressLabel}
            </Col>
            <Col flex="200px">
                <Progress
                    label
                    percentage={progress}
                    theme="line"
                    style={{ marginLeft: '10px', marginRight: '10px' }}
                />
            </Col>
            <Col>
                意向：{clientNum} 个，占比：{commentsTotal === 0 ? 0 : (clientNum / commentsTotal * 100).toFixed(0)} %
            </Col>
            {/* <Col>
                <Input
                    type="text"
                    placeholder="搜索评论内容"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    style={{marginLeft: 10, marginRight: 10}}
                    suffix={<SearchIcon/>}
                />
            </Col> */}
            {/*{progress===100&&<Col style={{ marginLeft: '10px' }}>*/}
            {/*    <Button onClick={()=>onReply(true)}>去私信</Button>*/}
            {/*</Col>}*/}
            <Col flex="auto">
                {
                    searchTerm ? "" :
                        <Pagination
                            totalContent={false}
                            theme="simple"
                            showPreviousAndNextBtn
                            total={commentsTotal}
                            current={currentPage}
                            pageSize={pageSize}
                            showPageSize={false}
                            onChange={(event) => {
                                const newPage = event.current;
                                const newPageSize = event.pageSize;
                                setCurrentPage(newPage);
                                setPageSize(newPageSize);
                            }}
                        // pageSizeOptions={[10, 20, 50]}
                        />
                }
            </Col>
        </Row>
    );
};

export default AnalysisProgress;
