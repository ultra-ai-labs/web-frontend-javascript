import React, {useState} from 'react';
import {Dialog, Tabs, Space, Button} from 'tdesign-react';
import {postWXPay} from "../api/api";
import QRCode from "qrcode.react";

export default function SubscriptionDialog({visible, setVisible, userSubscribeInfo}) {
    const personalPlans = [
        {title: '月度订阅', description: '每月30万条评论额度', price: 1380, discount: '无优惠', buttonText: '订阅'},
        {
            title: '季度订阅',
            description: '每月30万条评论额度',
            price: 3580,
            discount: '1193元/月 8.6折',
            buttonText: '订阅'
        },
        {
            title: '年度订阅',
            description: '每月30万条评论额度',
            price: 12980,
            discount: '1080元/月 7.8折',
            buttonText: '订阅'
        },
        {
            title: '按需充值',
            description: '10万条评论额度，当月有效',
            price: 480,
            discount: '临时使用',
            buttonText: '充值'
        }
    ];

    const enterprisePlans = [
        {
            title: '月度订阅',
            description: '60万条/月+高级品牌分析功能',
            price: 2580,
            discount: '无优惠',
            buttonText: '订阅'
        },
        {
            title: '季度订阅',
            description: '60万条/月+高级品牌分析功能',
            price: 5980,
            discount: '1993元/月 7.7折',
            buttonText: '订阅'
        },
        {
            title: '年度订阅',
            description: '60万条/月+高级品牌分析功能',
            price: 18800,
            discount: '1566元/月 6.1折',
            buttonText: '订阅'
        },
        {
            title: '按需充值',
            description: '10万条评论额度，当月有效',
            price: 480,
            discount: '临时使用',
            buttonText: '充值'
        }
    ];

    const [coverVisible, setCoverVisible] = useState(false);
    const [extractedUrl, setExtractedUrl] = useState('');
    const [currentTab, setCurrentTab] = useState('personal');
    const [codeVisible, setCodeVisible] = useState(false)
    const [payHeader,setPayHeader]=useState('')

    const wxpayQRCode = (subscription) => {
        postWXPay(subscription).then((data) => {
            if (data && data.code_url) {
                    setExtractedUrl( data.code_url);
            }
        }).catch(err=>console.log(err))
    }

    const handleSubscribe = (plan) => {
        let subscription = {
            'amount': plan.price * 100,
            "description": `${plan.title}:${plan.description}`,
            "attach": plan.discount
        }
        wxpayQRCode(subscription)
        setPayHeader(`${plan.title} ${plan.price}元`)
        if (userSubscribeInfo.package_type === '试用会员') {
            setCodeVisible(true)
            return;
        }
        if (userSubscribeInfo.package_type === '企业会员') {
            if (currentTab === 'personal') {
                setCoverVisible(true)
            } else {
                setCodeVisible(true)
            }
        } else {
            if (userSubscribeInfo.package_type === '个人会员') {
                setCoverVisible(true)
            } else {
                setCodeVisible(true)
            }
        }
    }


    const renderPlans = (plans) => {
        return plans.map((plan, index) => (
            <Space key={index} direction="vertical"
                   style={{
                       width: '100%', textAlign: "center", marginTop: "10px", paddingBottom: "15px",
                       border: '1px solid #f0f0f0', borderRadius: '8px'
                   }}>
                <h2>{plan.title}</h2>
                <p>{plan.description}</p>
                <p style={{fontWeight: 'bold', fontSize: '18px'}}>{plan.price}元</p>
                <div style={{marginTop: "10px"}}>
                    <p>{plan.discount}</p>
                </div>
                <Button
                    theme="primary"
                    style={{marginTop: '20px', alignSelf: 'center', width: 'auto'}} // 按钮不占满宽度
                    onClick={() => handleSubscribe(plan)} //对接后端接口
                >
                    {plan.buttonText}
                </Button>

            </Space>
        ));
    };


    return (
        <>
            <Dialog
                visible={visible}
                onClose={() => {
                    setVisible(false)
                }}
                header="套餐选择"
                footer={null}
                closeBtn
                width="1000px"
            >
                <Tabs defaultValue="personal" onChange={(v) => {
                    setCurrentTab(v)
                }}>
                    <Tabs.TabPanel value="personal" label="个人套餐">
                        <Space direction="horizontal" justify="space-between" style={{width: '100%'}}>
                            {renderPlans(personalPlans)}
                        </Space>
                    </Tabs.TabPanel>
                    <Tabs.TabPanel value="enterprise" label="企业套餐">
                        <Space direction="horizontal" justify="space-between" style={{width: '100%'}}>
                            {renderPlans(enterprisePlans)}
                        </Space>
                    </Tabs.TabPanel>
                </Tabs>
            </Dialog>

            <Dialog
                visible={coverVisible}
                onClose={() => setCoverVisible(false)}
                header="当前订阅未到期"
                footer={
                    <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                        <Button theme="default" variant="outline" onClick={() => setCoverVisible(false)}
                                style={{marginRight: '10px'}}>
                            取消
                        </Button>
                        <Button theme="primary" onClick={() => {
                            setCoverVisible(false);
                            setCodeVisible(true)
                        }}>
                            确认
                        </Button>
                    </div>
                }
                closeBtn={false}
                style={{width: '400px'}}
            >
                <p style={{color: '#999'}}>切换订阅模式会覆盖掉当前订阅</p>
            </Dialog>
            <Dialog
                visible={codeVisible}
                onClose={() => setCodeVisible(false)}
                header={null}
                footer={null}
                closeBtn={false}
            >
                <div style={{textAlign: 'center'}}>
                    <h2>{payHeader}</h2>
                    <QRCode value={extractedUrl} size={256}/>
                    <h2>微信扫码支付</h2>
                </div>
            </Dialog>
        </>

    );
}
