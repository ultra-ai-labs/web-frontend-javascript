import {Col, Space, Tag} from 'tdesign-react';

// const tipAll = `
// 背景：请分析以下内容并总结用户对相关产品/品牌的满意点、疑问点和不满点，输出用户群体的主要观点
// 结果：按照下面格式输出，注意满意点、疑问点和不满点都不要重复，观点按照由多到少的认同度排序，每个满意点、疑问点和不满点最多展示5个，最少展示1个，不要输出多余的内容
//
//     满意点：
//     1.满意点1
//     2.满意点2
//     3.满意点3
//
//     疑问点：
//     1.疑问点1
//     2.疑问点2
//     3.疑问点3
//
//     不满点：
//     1.不满点1
//     2.不满点2
//     3.不满点3
// `;

// const extractData = (data, type) => {
//     const regex = new RegExp(`${type}：[\\s\\S]*?(?=\\n\\S+：|\\s*$)`, 'g');
//     const match = regex.exec(data);
//     if (match) {
//         return match[0]
//             .split('\n')
//             .slice(1) // Remove the first element as it is the type
//             .map(item => item.replace(/^\d+\.\s*/, '').trim())
//             .map(item => item.replace(/[。？]$/, '')) // Remove trailing periods and question marks
//             .filter(item => item);
//     }
//     return [];
// };

export const ReplyIntentorSatisfaction = ({ satisfactionData,questionData,dissatisfactionData}) => {

    return (
        <Space direction='vertical' style={{marginLeft: "20px"}}>
            <h2 style={{height: "8px"}}>用户意向分析（供私信话术参考）</h2>
            <Space direction='vertical' style={{height: "auto", maxHeight: "40vh", overflowY: 'auto'}}>
                <Space align={'start'}>
                    <Col style={{width: "42px"}}>满意点</Col>
                    <Space breakLine>
                        {satisfactionData.map((point, index) => (
                            <Tag key={`satisfaction-${index}`} theme="success" variant="light-outline"
                                 style={{cursor: 'pointer'}}>
                                {point}
                            </Tag>
                        ))}
                    </Space>
                </Space>
                <Space align={'start'}>
                    <Col style={{width: "42px"}}>不满点</Col>
                    <Space breakLine>
                        {dissatisfactionData.map((point, index) => (
                            <Tag key={`dissatisfaction-${index}`} theme="danger" variant="light-outline"
                                 style={{cursor: 'pointer'}}>
                                {point}
                            </Tag>
                        ))}
                    </Space>
                </Space>
                <Space align={'start'}>
                    <Col style={{width: "42px"}}>疑问点</Col>
                    <Space breakLine>
                        {questionData.map((point, index) => (
                            <Tag key={`question-${index}`} theme="warning" variant="light-outline"
                                 style={{cursor: 'pointer'}}>
                                {point}
                            </Tag>
                        ))}
                    </Space>
                </Space>
            </Space>
        </Space>
    );
};
