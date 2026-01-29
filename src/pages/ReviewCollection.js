import React, { useState, useEffect, useRef } from 'react';
import {
    Space,
    Input,
    Checkbox,
    Upload,
    Tooltip,
    MessagePlugin,
    Button,
    SelectInput,
    Popconfirm,
    Tabs
} from 'tdesign-react';
import TabPanel from "tdesign-react/es/tabs/TabPanel";

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import { createXhsApi, postCommentCrawlApi, postshortToLongLinks } from "../api/api";
import { postChatModel } from '../api/modelService';

import CollectionInstructions from '../components/CollectionInstructions';
import CollectionTaskTable from "../components/CollectionTaskTable";

import AccountList from "../components/CollectionAccountList";
import CollectionMemberList from "../components/CollectionMemberList";

function ReviewCollection({ tasks, fetchTasks, totalTask, userSubscribeInfo, handleTabChange, accountName }) {
    const getCheckedOptions = () => {
        try {
            const storedOptions = localStorage.getItem('checkedOptions');
            const options = storedOptions ? JSON.parse(storedOptions) : ['dy'];
            return options.filter(opt => opt !== 'xhs');
        } catch (error) {
            console.error('Error accessing localStorage:', error);
            localStorage.setItem('checkedOptions', JSON.stringify(['dy']))
            return ['dy'];
        }
    };

    const [checkedOptions, setCheckedOptions] = useState(getCheckedOptions());
    const [value, setValue] = useState([]);
    const [options, setOptions] = useState([{ label: '全选', checkAll: true }]);
    const [inputValue, setInputValue] = useState('');
    // eslint-disable-next-line
    const [showInputValue, setShowInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const debounceTimeout = useRef(null);
    const checkboxValue = value.map(item => item.value);

    const [isPopconfirmVisible, setIsPopconfirmVisible] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);

    const [isCollectAbled, setIsCollectAbled] = useState(true)
    // const [remindChargeVisible, setRemindChargeVisible] = useState(false);
    const [chargeVisible, setChargeVisible] = useState(false)

    const fetchKeywordTips = async (keyword) => {
        setLoading(true);
        try {
            const data = await postChatModel(keyword, "keyword");
            let messageContent = data.messages[0].content;
            const match = messageContent.match(/\[.*?\]/);
            if (match) {
                messageContent = JSON.parse(match[0]);
            } else {
                messageContent = [];
            }

            const keywordOptions = messageContent.map((tip) => ({
                label: tip,
                value: tip,
            }));
            const selectedValues = value.map(item => item.value);
            const newOptions = options.filter(option => selectedValues.includes(option.value));
            const uniqueKeywordOptions = keywordOptions.filter(option => !selectedValues.includes(option.value));
            setOptions([...newOptions, ...uniqueKeywordOptions]);
            // MessagePlugin.success("关键词结果列表如下，请选择");

        } catch (error) {
            console.error('Failed to fetch keyword tips:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (value) => {
        setInputValue(value);
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            if (value) {
                fetchKeywordTips(value);
            }
        }, 200);
    };

    const onCheckedChange = (val, { current, type }) => {
        if (!current) {
            const newValue = type === 'check' ? options.slice(1) : [];
            setValue(newValue);
            return;
        }
        if (type === 'check') {
            const option = options.find(t => t.value === current);
            setValue([...value, option]);
        } else {
            const newValue = value.filter(v => v.value !== current);
            setValue(newValue);
        }
    };

    const onTagChange = (currentTags, context) => {
        const { trigger, index } = context;
        if (trigger === 'clear') {
            setValue([]);
        }
        if (['tag-remove', 'backspace'].includes(trigger)) {
            const newValue = [...value];
            newValue.splice(index, 1);
            setValue(newValue);
        }
        if (trigger === 'enter') {
            handleKeyPress();
        }
    };

    useEffect(() => {
        try {
            localStorage.setItem('checkedOptions', JSON.stringify(checkedOptions));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }, [checkedOptions]);

    const handleKeyPress = (event) => {
        if (!event || event.key === 'Enter') {
            if (inputValue) {
                const downloadButton = document.querySelector('button[disabled][style*="not-allowed"]');
                if (!downloadButton) {
                    MessagePlugin.error('插件未安装');
                    return;
                }

                checkedOptions.forEach(option => {
                    value.forEach(val => {
                        const message = {
                            action: 'openSearch',
                            query: val.value,  // 使用val.value而不是leadKeyword
                            platform: '抖音'
                        };
                        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                            chrome.runtime.sendMessage(downloadButton.innerText, message, (response) => {
                                if (response && response.status === 'success') {
                                    MessagePlugin.success(`已打开搜索链接`);
                                } else {
                                    MessagePlugin.error(`打开搜索链接失败`);
                                }
                            });
                        } else {
                            console.error('Not running in a Chrome extension environment.');
                        }
                    });
                    const inputValueMessage = {
                        action: 'openSearch',
                        query: inputValue,  // 使用 inputValue
                        platform: '抖音'
                    };
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage(downloadButton.innerText, inputValueMessage, (response) => {
                            if (response && response.status === 'success') {
                                MessagePlugin.success(`已打开搜索链接`);
                            } else {
                                MessagePlugin.error(`打开搜索链接失败`);
                            }
                        });
                    } else {
                        console.error('Not running in a Chrome extension environment.');
                    }
                });
            } else {
                MessagePlugin.error('请输入线索关键词');
            }
        }
    };


    const handleCheckboxChange = (value) => {
        setCheckedOptions(value);
    };

    const postCommentCrawl = (hiddenData) => {
        const { ids, keyword, platform, tokens, titles } = { ...hiddenData };

        // 构建新的数据结构
        const awemes = ids.map((id, index) => ({
            id: id,
            title: titles?.[index] || "", // 如果titles存在则使用对应index的title，否则使用空字符串
            xsec_token: tokens?.[index].token || ""
        }));

        const back_data = {
            awemes,
            platform,
            keyword
        }
        console.log(back_data)
        postCommentCrawlApi(back_data)
            .then(() => {
                fetchTasks(); // 任务添加成功后获取最新任务列表
                MessagePlugin.success("任务添加成功！");
            })
            .catch((error) => {
                console.error('收集评论请求失败:', error);
            });
        if (tokens && tokens.length > 0) {
            const requests = tokens.map(token =>
                createXhsApi({
                    explore: token.id,
                    xsec_token: token.token
                })
            );
            // 使用 Promise.all 发送并等待所有请求完成
            Promise.all(requests)
                .then()
                .catch(error => {
                    // 处理请求中的任何错误
                    console.error("请求出错：", error);
                });
        }
    };

    const handleBeforeUpload = (file) => {
        // 检查文件格式是否为xlsx, xls, csv
        const validFormats = ['.csv', '.xls', '.xlsx'];
        const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

        if (!validFormats.includes(fileExtension)) {
            MessagePlugin.error('文件格式不正确，请上传xlsx, xls或csv格式的文件');
            return false;
        }

        MessagePlugin.success('文件上传成功');
        setUploadedFile(file);

        // 显示输入关键词的弹框
        setIsPopconfirmVisible(true);
        return false;  // 阻止文件自动上传
    };

    const handlePopconfirmOk = () => {
        if (!keyword) {
            MessagePlugin.error('关键词不能为空');
            return;
        }

        const handleFileContent = (fileContent, fileType) => {
            if (fileType === 'csv') {
                Papa.parse(fileContent, {
                    complete: (results) => {
                        processParsedData(results.data, keyword);
                    },
                });
            } else if (fileType === 'xlsx' || fileType === 'xls') {
                const workbook = XLSX.read(fileContent, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
                processParsedData(worksheet, keyword);
            }
        };

        const processParsedData = async (data, keyword) => {
            // const xhsShortLinks = [];
            const dyShortLinks = [];
            const dyLongLinks = [];
            // const xhsLongLinks = [];

            data.forEach(row => {
                row.forEach(cell => {
                    if (typeof cell === 'string' && cell.startsWith('http')) {
                        // if (cell.includes('xhslink.com')) {
                        //     xhsShortLinks.push(cell);
                        /* } else */ if (cell.includes('v.douyin.com')) {
                            dyShortLinks.push(cell);
                        } else if (cell.match(/video\/(\d+)/) || cell.match(/douyin.com\/video\/(\d+)/)) {
                            dyLongLinks.push(cell);
                        // } else if (cell.includes('xiaohongshu.com')) {
                        //     xhsLongLinks.push(cell);
                        }
                    }
                });
            });

            // if (xhsShortLinks.length > 0) {
            //     const data = await postshortToLongLinks({ urls: xhsShortLinks });
            //     xhsLongLinks.push(...data.data.urls);
            // }
            if (dyShortLinks.length > 0) {
                const data = await postshortToLongLinks({ urls: dyShortLinks });
                dyLongLinks.push(...data.data.urls);
            }
            // if (xhsLongLinks.length > 0) {
            //     const xhsIds = xhsLongLinks.map(link => {
            //         const matchSearchResult = link.match(/search_result\/([a-zA-Z0-9]+)/);
            //         const matchExplore = link.match(/explore\/([a-zA-Z0-9]+)/);
            //         const matchDiscoveryItem = link.match(/discovery\/item\/([a-zA-Z0-9]+)/);
            //         return matchSearchResult ? matchSearchResult[1]
            //             : matchExplore ? matchExplore[1]
            //                 : matchDiscoveryItem ? matchDiscoveryItem[1]
            //                     : null;
            //     }).filter(id => id !== null);

            //     const back_data = {
            //         platform: 'xhs',
            //         keyword,
            //         ids: xhsIds,
            //     };
            //     postCommentCrawl(back_data);//TODO:为什么这里还有爬取
            // }
            if (dyLongLinks.length > 0) {
                const dyIds = dyLongLinks.map(link => {
                    const matchVideo = link.match(/video\/(\d+)/);
                    return matchVideo ? matchVideo[1] : null;
                }).filter(id => id !== null);

                const back_data = {
                    platform: 'dy',
                    keyword,
                    ids: dyIds,
                };
                postCommentCrawl(back_data);
            }
        };
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileContent = event.target.result;
            const fileType = uploadedFile.name.endsWith('.csv') ? 'csv' : 'xlsx';
            handleFileContent(fileContent, fileType);
        };

        if (uploadedFile.name.endsWith('.csv')) {
            reader.readAsText(uploadedFile.raw);
        } else {
            reader.readAsArrayBuffer(uploadedFile.raw);
        }

        // 隐藏弹框
        setIsPopconfirmVisible(false);
    };


    const handlePopconfirmCancel = () => {
        setIsPopconfirmVisible(false);
    };


    //检测background是否回传数据
    const hiddenDataContainerRef = useRef(null);
    const [hiddenDataText, setHiddenDataText] = useState('');
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(() => {
                // console.log('DOM changed:', mutation);
                // console.log('hiddenDataContainer innerText:', hiddenDataContainerRef.current.innerText);
                const newText = hiddenDataContainerRef.current.innerText;
                setHiddenDataText(newText);
            });
        });

        const config = { attributes: true, childList: true, subtree: true };

        const checkElement = () => {
            hiddenDataContainerRef.current = document.querySelector('#hiddenDataContainer');
            if (hiddenDataContainerRef.current) {
                observer.observe(hiddenDataContainerRef.current, config);
                // console.log('Observer started');
            } else {
                // 如果元素还不存在，每隔500毫秒检查一次
                setTimeout(checkElement, 500);
            }
        };
        checkElement();
        // Cleanup function
        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isCollectAbled) {
            // setRemindChargeVisible(true)
        } else {
            if (hiddenDataText) {
                const text = JSON.parse(hiddenDataText);
                // console.log('Retrieved data from hidden div:', text);
                postCommentCrawl(text);
            }
        }
        // eslint-disable-next-line
    }, [hiddenDataText])

    return (
        <div style={{ padding: '20px' }}>
            <CollectionInstructions />
            <div style={{ width: '100%', textAlign: "center" }}>
                <Space align='center' style={{ marginTop: "10vh" }}>
                    <Popconfirm
                        content={
                            <div>
                                <p>请输入内容列表关键词名称</p>
                                <Input
                                    value={keyword}
                                    onChange={(value) => setKeyword(value)}
                                    placeholder="例如：留学服务"
                                />
                            </div>
                        }
                        destroyOnClose
                        placement="top"  // 确保弹框显示在上方
                        showArrow
                        theme="default"
                        visible={isPopconfirmVisible}
                        onConfirm={handlePopconfirmOk}
                        onCancel={handlePopconfirmCancel}
                    >
                        <div>
                            <Upload
                                disabled={!isCollectAbled}
                                accept=".csv,.xls,.xlsx"
                                beforeUpload={handleBeforeUpload}
                                showUploadProgress={false}
                                useMockProgress={false}
                            >
                                <Tooltip content={<div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Tooltip content={<img
                                        src="https://pica.zhimg.com/70/v2-3f265690b25be5a741622eef49311929_1440w.avis?source=172ae18b&biz_tag=Post"
                                        alt="上传格式" style={{ width: '400px', height: 'auto' }} />} theme="light">
                                        <span style={{
                                            marginLeft: '10px',
                                            color: "#0052D9"
                                        }}>查看上传列表示例</span>
                                    </Tooltip>
                                </div>} theme="light">
                                    <Button variant="outline">
                                        上传已有列表
                                    </Button>
                                </Tooltip>
                            </Upload>
                        </div>
                    </Popconfirm>

                    <SelectInput
                        disabled={!isCollectAbled}
                        style={{ width: '40vw', textAlign: "left" }}
                        value={value}
                        tagInputProps={{ excessTagsDisplayType: 'break-line' }}
                        placeholder="输入关键词回车搜索，可以带地区输入如：石家庄  租房"
                        allowInput
                        clearable
                        multiple
                        onTagChange={onTagChange}
                        onInputChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        inputValue={inputValue}
                        loading={loading}
                        autofocus
                        suffix={showInputValue}
                        showInput

                        inputProps={{
                            showInput: true,
                            // onBlur: () => {
                            //     setShowInputValue(inputValue);
                            // },
                            // onFocus: () => {
                            //     setShowInputValue('')
                            // }
                        }}
                        panel={
                            <Checkbox.Group
                                value={checkboxValue}
                                options={options}
                                className="tdesign-demo__panel-options-excess-tags-display-type"
                                onChange={onCheckedChange}
                            />
                        }
                    />
                    <Button onClick={() => {
                        if (!isCollectAbled) {
                            setChargeVisible(true)
                        } else {
                            handleKeyPress()
                        }
                    }}>
                        搜索
                    </Button>
                    {/* <Space>
                        <Checkbox.Group
                            options={[
                                { label: '抖音', value: 'dy' },
                                // { label: '小红书', value: 'xhs' },
                            ]}
                            value={checkedOptions}
                            onChange={handleCheckboxChange}
                        />
                    </Space> */}
                </Space>
            </div>
            <Space direction="vertical" style={{ width: '100%', textAlign: "center" }}>
                <Popconfirm
                    style={{ width: '300px', textAlign: "center" }}
                    visible={chargeVisible}
                    content={
                        <div>
                            <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>评论收集额度已用完</p>
                            <p>请升级套餐使用</p>
                        </div>
                    }
                    destroyOnClose
                    placement="bottom"
                    showArrow
                    theme="default"
                    cancelBtn={<Button theme="default" variant="outline"
                        onClick={() => setChargeVisible(false)}>取消</Button>}
                    confirmBtn={<Button theme="primary" onClick={() => setChargeVisible(false)}>确认</Button>}
                />
                {accountName === '智擎获客' && <Tabs placement={'top'} size={'medium'} defaultValue={1}>
                    <TabPanel value={1} label="任务管理">
                        <CollectionTaskTable
                            data={tasks}
                            fetchTasks={fetchTasks}
                            totalTask={totalTask}
                            handleTabChange={handleTabChange}
                            setIsCollectAbled={setIsCollectAbled}
                            chargeVisible={chargeVisible}
                            setChargeVisible={setChargeVisible}
                            userSubscribeInfo={userSubscribeInfo}
                        />
                    </TabPanel>
                    <TabPanel value={2} label="活跃会员">
                        <AccountList />
                    </TabPanel>
                    <TabPanel value={3} label="会员管理">
                        <CollectionMemberList />
                    </TabPanel>
                </Tabs>}
                {accountName !== '智擎获客' && <CollectionTaskTable
                    data={tasks}
                    fetchTasks={fetchTasks}
                    totalTask={totalTask}
                    handleTabChange={handleTabChange}
                    setIsCollectAbled={setIsCollectAbled}
                    chargeVisible={chargeVisible}
                    setChargeVisible={setChargeVisible}
                    userSubscribeInfo={userSubscribeInfo}
                />}
            </Space>

        </div>
    )
}

export default ReviewCollection;
