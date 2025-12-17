// src/components/CollectionInstructions.js
import React, { useState, useEffect, useRef } from 'react';

const EXTENSION_URL = 'https://iry-1256349444.cos.ap-guangzhou.myqcloud.com/%E5%86%85%E5%AE%B9%E6%94%B6%E9%9B%86%E6%8F%92%E4%BB%B6.zip';
const validVersion = ['1.6']

const CollectionInstructions = () => {
    const [show, setShow] = useState(false);
    const versionContainerRef = useRef(null);

    const checkVersion = () => {
        setTimeout(() => {
            versionContainerRef.current = document.querySelector('#versionContainer');
            if (versionContainerRef.current) {
                const isValidVersion = validVersion.some(version => version === versionContainerRef.current.innerText);
                if (!isValidVersion) {
                    setShow(true);
                }
            }
            else {
                setShow(true)
            }
        }, 500)
    }

    const checkExtensionInstalled = () => {
        setTimeout(() => {
            const collectButton = document.getElementById('start-collect-comments');
            if (collectButton) {
                setShow(false);
            } else {
                setShow(true);
                // downloadExtension();
            }
        }, 500); // 延迟一会
    };

    useEffect(() => {
        checkExtensionInstalled();
        checkVersion();

        const handleExtensionInstalled = () => {
            setShow(false);
        };

        // 添加事件监听器以检测扩展安装事件
        window.addEventListener('extensionInstalled', handleExtensionInstalled);

        return () => {
            window.removeEventListener('extensionInstalled', handleExtensionInstalled);
        };
    }, []);

    if (!show) return null;

    return (
        <div style={{
            backgroundColor: 'rgba(52,145,250,0.10)',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',

        }}>
            <h3>使用评论收集功能推荐使用Windows10/11系统电脑，Edge或Chrome浏览器，下载安装<span style={{ color: '#165DFF' }}>最新的</span>评论收集插件，注意有原来的插件要删除，弹出此提示说明插件有更新</h3>
            <p>安装或更新收集插件视频：<a href={"https://xcn9f50y4vw5.feishu.cn/wiki/Y26hwDUgAioiDzkx7CbcZFC5n1b#share-ZPBed4YFSolUfMxASrvc65zJn8g"} target="_blank" rel="noreferrer">查看视频教程</a></p>
            <p>1.点击右侧下载 <a href={EXTENSION_URL} download="智能线索插件.zip">.zip文件</a> 并解压缩，得到插件的文件夹，注意安装完成后也不要移动和删除解压后的文件夹</p>
            <p>2.打开 Edge或Chrome 浏览器，复制 <code>chrome://extensions</code> 并粘贴到地址栏中，进入扩展设置。</p>
            <p>3.在扩展管理页面的右上角，打开“开发者模式”。</p>
            <p>4.点击左上角的“加载已解压的扩展程序”按钮，在弹出的文件选择对话框中，选择解压后的插件文件夹。（如果有旧版本的插件请移除）</p>
            <p>5.确认插件已安装，在扩展管理页面中，应该能够看到刚刚加载的插件，并且插件已经启用</p>
            <p>6.安装完成后，请刷新此页面，注意不要移动和删除解压后的插件文件夹</p>
        </div>
    );
};

export default CollectionInstructions;
