import React from 'react';
import {Space, Card, Form, Input, Button, MessagePlugin, Row} from 'tdesign-react';
import {UserIcon, LockOnIcon} from 'tdesign-icons-react';
import {login} from '../api/api';
import {useNavigate} from 'react-router-dom';

const {FormItem} = Form;

function Login() {
    const navigate = useNavigate();

    const onSubmit = async (e) => {
        // console.log(e);
        if (e.validateResult === true) {
            const {account, password} = e.fields;
            try {
                await login(account, password).then(
                    response => {
                        localStorage.setItem('token', response.token);
                        const userInfo = {username: account};
                        localStorage.setItem('userInfo', JSON.stringify(userInfo));
                        MessagePlugin.info('登录成功').then(
                            navigate('/home')
                        )
                    }
                );

            } catch (error) {
                console.error('Login error:', error);
                MessagePlugin.warning('用户名和密码错误');
            }
        }
    };

    const onReset = (e) => {
        console.log(e);
        MessagePlugin.info('重置成功');
    };

    return (
        <div style={{
            backgroundImage: 'url("https://picx.zhimg.com/70/v2-52dbe8bdb0e4854c1e5bd39ff75a68d6_1440w.avis?source=172ae18b&biz_tag=Post")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <Space style={{width: '100%', height: '100%'}}>
                <Card style={{
                    width: '350px',
                    padding: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    marginLeft: '50vw',
                    marginTop: '30vh'
                }}>

                    <Row style={{textAlign: "center",marginLeft:58}}>
                        <img style={{width: "30px", marginLeft: 0, marginTop: 15, marginRight: 10}} src={`${process.env.PUBLIC_URL}/favicon.png`} alt="logo"/>
                        <h2 style={{color: "#3491FA"}}>智擎获客</h2>
                    </Row>
                    <Form statusIcon={true} onSubmit={onSubmit} onReset={onReset} colon={true} labelWidth={0}>
                        <FormItem name="account">
                            <Input clearable={true} prefixIcon={<UserIcon/>} placeholder="请输入账户名"/>
                        </FormItem>
                        <FormItem name="password">
                            <Input type="password" prefixIcon={<LockOnIcon/>} clearable={true}
                                   placeholder="请输入密码"/>
                        </FormItem>
                        <FormItem>
                            <Button theme="primary" type="submit" block>
                                登录
                            </Button>
                        </FormItem>
                    </Form>
                </Card>
            </Space>
        </div>
    );
}

export default Login;
