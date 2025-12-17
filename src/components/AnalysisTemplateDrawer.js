import React, {useState, useEffect, useCallback} from 'react';
import {Drawer, Button, Textarea, Space, MessagePlugin, Popconfirm, Dialog, Loading} from 'tdesign-react';
import {createTemplateApi, deleteTemplateApi, getTemplateApi, updateTemplateApi} from '../api/api';
import {postChatModel} from '../api/modelService';

const TemplateDrawer = ({onTemplateUse, taskId, currentKeyWord,inputValue}) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [modalVisible, setModalVisble] = useState(false);
    const [loading, setLoading] = useState(false);//生成模板的等待
    const [templates, setTemplates] = useState([]);//drawer的template列表
    const [additionalInput1, setAdditionalInput1] = useState('');//页面上显示的
    const [additionalInput2, setAdditionalInput2] = useState('');
    const [generateInput1, setGenerateInput1] = useState('正在生成模板')//生成的模板数据
    const [generateInput2, setGenerateInput2] = useState('')

    useEffect(() => {
        const fetchTemplateData = async () => {
            try {
                const data = await getTemplateApi();

                // 判断模版是否为空
                if (!data || !data.data) {
                    console.info("Failed to fetch template data or data is undefined.");
                }

                if (data.data.length === 0) {
                    initialGenerate();
                } else {
                    // 判断有没有默认模版并选中填充
                    const defaultTemplate = data.data.find(template => template.default === 1);

                    if (!defaultTemplate) {
                        const storedData = localStorage.getItem(`${taskId}-template`);

                        if (storedData) {
                            const { additionalInput1, additionalInput2 } = JSON.parse(storedData);

                            setAdditionalInput1(additionalInput1);
                            setAdditionalInput2(additionalInput2);

                            // 仅在状态与localStorage数据不一致时调用onTemplateUse
                            if (additionalInput1 !== storedData.additionalInput1 || additionalInput2 !== storedData.additionalInput2) {
                                onTemplateUse(additionalInput1, additionalInput2);
                            }
                        } else {
                            initialGenerate();
                        }
                    } else {
                        setAdditionalInput1(defaultTemplate.service_introduction);
                        setAdditionalInput2(defaultTemplate.customer_description);
                        onTemplateUse(defaultTemplate.service_introduction, defaultTemplate.customer_description);
                    }
                }

                setTemplates(data.data);
            } catch (error) {
                console.error("Error fetching template data:", error);
                // 可以在这里添加一个错误提示，或其他错误处理逻辑
            }
        };

        fetchTemplateData().then()
        // eslint-disable-next-line
    }, [taskId]);

    //页面展示为空时生成提示词
    const initialGenerate = async () => {
        setLoading(true);
        setAdditionalInput1('');
        setAdditionalInput2('');

        if (taskId) {
            const data = await postChatModel(currentKeyWord, "template");
            try {
                if (data.code === 0) {
                    const jsonData = JSON.parse(data.messages[0].content); // 此处可能出错
                    setAdditionalInput1(jsonData['我提供的服务介绍']);
                    setAdditionalInput2(jsonData['我想要的客户描述']);
                    setLoading(false);

                    localStorage.setItem(`${taskId}-template`, JSON.stringify({
                        additionalInput1: jsonData['我提供的服务介绍'],
                        additionalInput2: jsonData['我想要的客户描述']
                    }));
                    onTemplateUse(jsonData['我提供的服务介绍'], jsonData['我想要的客户描述']);
                }
            } catch (error) {
                console.error("Error parsing JSON:", error);
                MessagePlugin.error("模板解析失败，请检查后台数据格式");
            }
        }
    };

    //根据提示词生成模版数据
    const generateTemplate = async () => {
        setGenerateInput1('')
        setGenerateInput2('')
        setLoading(true);
        let data;
        if(inputValue){
            data = await postChatModel(inputValue, "template")
        }else{
            data=await postChatModel(currentKeyWord, "template")
        }
        const jsonData = JSON.parse(data.messages[0].content)
        setGenerateInput1(jsonData['我提供的服务介绍'])
        setGenerateInput2(jsonData['我想要的客户描述'])
        setLoading(false)
    }

    //更新现在的模板数据
    const conformTemplate = useCallback(() => {
        setAdditionalInput1(generateInput1)
        setAdditionalInput2(generateInput2)
        onTemplateUse(generateInput1, generateInput2)

        localStorage.setItem(`${taskId}-template`, JSON.stringify({
            additionalInput1: generateInput1,
            additionalInput2: generateInput2
        }));

        // eslint-disable-next-line
    }, [generateInput1, generateInput2])

    //更新两个大输入框
    const handleInputChange1 = (value) => {
        setAdditionalInput1(value);
        onTemplateUse(value, additionalInput2);
        // 更新 localStorage
        localStorage.setItem(`${taskId}-template`, JSON.stringify({additionalInput1: value, additionalInput2}));
    };
    const handleInputChange2 = (value) => {
        setAdditionalInput2(value);
        onTemplateUse(additionalInput1, value);
        // 更新 localStorage
        localStorage.setItem(`${taskId}-template`, JSON.stringify({additionalInput1, additionalInput2: value}));
    };

    const handle_select = () => {
        getTemplateApi().then(data => {
            setDrawerVisible(true);
            setTemplates(data.data)
        }).catch(err => console.log(err))
    };

    const handleClose = () => {
        setDrawerVisible(false);
        handleUpdateTemplate()
    };

    //新增模版
    const handleAddTemplate = async () => {
        if (templates.length < 10) {
            const newTemplate = {
                service_introduction: additionalInput1,
                customer_description: additionalInput2,
            };
            createTemplateApi(newTemplate).then(data => {
                if (data) {
                    setTemplates([...templates, data.data])
                }
            })
        } else {
            MessagePlugin.warning('最多只能添加10个模板');
        }
    };

    //删除模版
    const handleDeleteTemplate = (id) => {
        if (templates.length === 1) {
            MessagePlugin.warning('不能删除该模板');
            return;
        }
        deleteTemplateApi({id}).then(data => {
            MessagePlugin.success("删除模板成功")
            getTemplateApi().then(data => {
                setTemplates(data.data)
            })
        }).catch(err => {
            console.log(err)
            MessagePlugin.error("删除模板失败")
        })
    };

    const handleInputChange = (id, field, value) => {
        const updatedTemplates = templates.map((template) =>
            template.id === id ? {...template, [field]: value} : template
        );
        setTemplates(updatedTemplates);
    };

    const handleSetDefault = async (id) => {
        let currentDefaultId = null;

        // 找到当前的默认模板ID
        templates.forEach(template => {
            if (template.default === 1) {
                currentDefaultId = template.id;
            }
        });

        // 先取消当前的默认模板
        if (currentDefaultId !== null) {
            const updatedTemplate = {...templates.find(template => template.id === currentDefaultId), default: 0};
            updateTemplateApi(updatedTemplate);
        }

        // 设置新的默认模板
        const newDefaultTemplate = {...templates.find(template => template.id === id), default: 1};
        await updateTemplateApi(newDefaultTemplate);

        // 获取更新后的模板列表并设置到状态中
        const data = await getTemplateApi();
        setTemplates(data.data);
        if (additionalInput1 === "" && additionalInput2 === "") {
            setAdditionalInput1(newDefaultTemplate.customer_description);
            setAdditionalInput2(newDefaultTemplate.service_introduction);
            onTemplateUse(newDefaultTemplate.service_introduction, newDefaultTemplate.customer_description)
        }
    };


    const handleUseTemplate = (service_introduction, customer_description) => {
        setAdditionalInput1(service_introduction);
        setAdditionalInput2(customer_description);
        onTemplateUse(service_introduction, customer_description);
        localStorage.setItem(`${taskId}-template`, JSON.stringify({
            additionalInput1: service_introduction,
            additionalInput2: customer_description
        }));

    };

    const handleUpdateTemplate = async () => {
        const oldTemplates = await getTemplateApi().then(data => data.data);
        let isUpdate = false;

        templates.forEach(template => {
            const matchingOldTemplate = oldTemplates.find(oldTemplate => oldTemplate.id === template.id);
            if (matchingOldTemplate && JSON.stringify(matchingOldTemplate) !== JSON.stringify(template)) {
                isUpdate = true
                updateTemplateApi(template);
            }
        });
        if (isUpdate) MessagePlugin.success("保存模板成功")
    };

    return (
        <>
            <Space direction='horizontal' style={{width: '50vw'}}>
                <Space direction='vertical'>
                    <div>我提供的服务介绍</div>
                    <Textarea
                        placeholder="例如：我是一家植发机构，提供植发服务"
                        autosize={{minRows: 3}}
                        value={additionalInput1}
                        onChange={handleInputChange1}
                        style={{marginBottom: '10px', width: '400px'}}
                        disabled={loading}
                    />
                </Space>
                <Space direction='vertical'>
                    <div>我想要的客户描述</div>
                    <Textarea
                        placeholder="例如：我想要有植发需求的客户"
                        autosize={{minRows: 3}}
                        value={additionalInput2}
                        onChange={handleInputChange2}
                        style={{marginBottom: '10px', width: '400px'}}
                        disabled={loading}
                    />
                </Space>
                <Space direction='vertical'>
                    <Button type="primary" onClick={handle_select}>
                        我的模版
                    </Button>
                    <Popconfirm
                        theme={'default'}
                        icon={null}
                        content={<>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%'
                            }}>
                                <h2>AI建议</h2>
                            </div>
                            <Loading loading={loading}>
                                <Space direction='vertical'>
                                    <span>我提供的服务介绍：{generateInput1}</span>
                                    <span>我想要的客户描述：{generateInput2}</span>
                                </Space>
                            </Loading>
                        </>
                        }
                        popupProps={{
                            placement: 'bottom-left',
                        }}
                        confirmBtn={
                            <Button theme={'primary'} size={'small'} onClick={conformTemplate}>
                                使用
                            </Button>
                        }
                        cancelBtn={
                            <Button theme={'default'} size={'small'} variant={'outline'}>
                                取消
                            </Button>
                        }
                    >
                        <Button theme="primary" onClick={generateTemplate}>
                            生成模板
                        </Button>
                    </Popconfirm>
                    <Dialog
                        header={
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%'
                            }}>
                                <h2>AI建议</h2>
                            </div>}
                        visible={modalVisible}
                        onClose={() => setModalVisble(false)}
                        onConfirm={conformTemplate}
                        onCancel={() => setModalVisble(false)}
                    >
                    </Dialog>
                </Space>
            </Space>
            <Drawer
                visible={drawerVisible}
                header={`分析提示模版 ${templates.length}/5`}
                onClose={handleClose}
                footer=""
                placement="right"
                size='medium'
            >
                {templates.map((template, index) => (
                    <div key={template.id} style={{marginBottom: "20px"}}>
                        <Space style={{width: '100%'}}>
                            <div style={{marginTop: "5px"}}>模板 {index + 1} </div>
                            <Button
                                theme="primary"
                                variant="text"
                                onClick={() => handleUseTemplate(template.service_introduction, template.customer_description)}>
                                使用
                            </Button>
                            <Button
                                theme="danger"
                                variant="text"
                                onClick={() => handleDeleteTemplate(template.id)}
                            >
                                删除
                            </Button>
                            {template.default === 1 ? (
                                <Button
                                    theme='success'
                                    onClick={() => handleSetDefault(template.id)}
                                    style={{marginLeft: '10px'}}
                                >
                                    取消默认
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => handleSetDefault(template.id)}
                                    style={{marginLeft: '10px'}}
                                >
                                    设为默认
                                </Button>
                            )}
                        </Space>
                        <Space direction='vertical' align='center' style={{width: '100%'}}>
                            <Textarea
                                placeholder="介绍一下我的服务，例如：我是一家植发机构，提供植发服务"
                                value={template.service_introduction}
                                onChange={(value) => handleInputChange(template.id, 'service_introduction', value)}
                                maxLength={200}
                                style={{marginTop: '10px', width: '100%'}}
                                autosize={{ minRows: 3, maxRows: 5 }}
                            />
                            <Textarea
                                placeholder="描述一下我想要的客户，例如：我想要有植发需求的客户"
                                value={template.customer_description}
                                onChange={(value) => handleInputChange(template.id, 'customer_description', value)}
                                maxLength={200}
                                style={{marginTop: '10px', width: '100%'}}
                                autosize={{ minRows: 3, maxRows: 5 }}
                            />
                        </Space>
                    </div>
                ))}
                <Button onClick={handleAddTemplate}>新增模板</Button>
            </Drawer>
        </>
    );
};

export default TemplateDrawer;
