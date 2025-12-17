import {Space, Textarea} from "tdesign-react";
import {useEffect, useState} from "react";
import {getKvApi, createKvApi} from "../api/api";

const AnalysisCard = ({taskId}) => {
    const [templateData, setTemplateData] = useState({
        content1: '',
        content2: ''
    });

    useEffect(() => {
        const fetchTemplateData = async () => {
            const response = await getKvApi(taskId, "template");
            if (response.code === 200 && response.data.length > 0) {
                const jsonValue = JSON.parse(response.data[0].json_value);
                setTemplateData({
                    content1: jsonValue.content1 || '',
                    content2: jsonValue.content2 || ''
                });
            } else {
                const localData = localStorage.getItem(`${taskId}-template`);
                if (localData) {
                    const localJsonValue = JSON.parse(localData);
                    const processLocalData = {
                        content1: localJsonValue.additionalInput1 || '',
                        content2: localJsonValue.additionalInput2 || ''
                    }
                    setTemplateData(processLocalData);

                    const back_data = {
                        "task_id": taskId,
                        "json_key": "template",
                        "json_value": JSON.stringify(processLocalData)
                    };
                    await createKvApi(back_data);
                } else {
                    setTemplateData({
                        content1: '',
                        content2: ''
                    });
                }
            }

        };

        if (taskId) {
            fetchTemplateData();
        }
    }, [taskId]);

    return (
        <Space direction="horizontal" size="small" style={{width: '40vw'}}>
            <Space direction="vertical" size={4}>
                <div>我提供的服务介绍</div>
                <Textarea
                    // bordered
                    // size="small"
                    // theme="normal"
                    style={{width: '21vw'}}
                    value= {templateData?.content1 || '暂无服务介绍'}
                    autosize={{ minRows: 3, maxRows: 3 }}
                    disabled
                >
                </Textarea>
            </Space>

            <Space direction="vertical" size={4}>
                <div>我想要的客户描述:</div>
                <Textarea
                    // bordered
                    // size="small"
                    // theme="normal"
                    style={{width: '21vw'}}
                    value= {templateData?.content2 || '暂无客户描述'}
                    autosize={{ minRows: 3, maxRows: 3 }}
                    disabled
                >
                </Textarea>
            </Space>
        </Space>
    );
}

export default AnalysisCard;