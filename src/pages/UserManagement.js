import React, { useState } from 'react';
import { Input, Button, MessagePlugin, Dialog } from 'tdesign-react';
import { adminGetUserApi, adminCreateUserApi, adminUpdateUserApi, adminDeleteUserApi, adminListUsersApi } from '../api/api';
import { adminGetUserQuotaApi, adminUpdateUserQuotaApi } from '../api/api';


const UserManagement = () => {
    const [adminPwd, setAdminPwd] = useState(localStorage.getItem('admin_pwd') || '');
    const [userId, setUserId] = useState('');
    const [user, setUser] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [visibleEdit, setVisibleEdit] = useState(false);
    const [visibleQuotaEdit, setVisibleQuotaEdit] = useState(false);
    const [quotaForm, setQuotaForm] = useState({ user_id: '', total_quota: 0, used_quota: 0 });
    const [editForm, setEditForm] = useState({ user_id: '', username: '', email: '', password: '', expire_time: '' });
    const [offset, setOffset] = useState(0);
    const [limit, setLimit] = useState(50);
    const [visibleCreate, setVisibleCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ user_id: '', username: '', email: '', password: '', expire_time: '' });

    const saveAdminPwd = (pwd) => {
        setAdminPwd(pwd);
        try { localStorage.setItem('admin_pwd', pwd); } catch (e) {}
    };

    const handleFetch = async () => {
        if (!adminPwd) { MessagePlugin.error('请先填写管理员密码'); return; }
        if (!userId) { MessagePlugin.error('请输入 user_id'); return; }
        const res = await adminGetUserApi(userId, adminPwd);
        if (!res) { MessagePlugin.error('请求失败'); return; }
        if (res.status === 200) { setUser(res.data); MessagePlugin.success('获取成功'); }
        else { MessagePlugin.error(res.msg || '获取失败'); setUser(null); }
    };

    const handleCreate = async () => {
        if (!adminPwd) { MessagePlugin.error('请先填写管理员密码'); return; }
        const payload = { ...createForm };
        // convert expire_time (yyyy-mm-dd hh:mm or unix) to unix timestamp
        if (payload.expire_time) {
            const ts = parseExpireToUnix(payload.expire_time);
            payload.expire_time = ts;
        }
        const res = await adminCreateUserApi(payload, adminPwd);
        if (!res) { MessagePlugin.error('请求失败'); return; }
        if (res.status === 200) {
            MessagePlugin.success('创建成功');
            setVisibleCreate(false);
            setCreateForm({ user_id: '', username: '', email: '', password: '', expire_time: '' });
        } else {
            MessagePlugin.error(res.msg || '创建失败');
        }
    };

    const handleUpdate = async () => {
        if (!adminPwd) { MessagePlugin.error('请先填写管理员密码'); return; }
        if (!user) { MessagePlugin.error('请先获取用户'); return; }
        const payload = { username: user.username, email: user.email, password: user.password, expire_time: user.expire_time };
        if (payload.expire_time) {
            const ts = parseExpireToUnix(payload.expire_time);
            payload.expire_time = ts;
        }
        const res = await adminUpdateUserApi(user.user_id, payload, adminPwd);
        if (!res) { MessagePlugin.error('请求失败'); return; }
        if (res.status === 200) { MessagePlugin.success('更新成功'); setUser(res.data); }
        else { MessagePlugin.error(res.msg || '更新失败'); }
    };

    // parse strings like '2024-12-31 23:59' or numeric strings into unix timestamp (seconds)
    const parseExpireToUnix = (val) => {
        if (val === null || val === undefined || val === '') return null;
        // already numeric (seconds or ms)
        if (/^\d+$/.test(String(val).trim())) {
            const n = Number(String(val).trim());
            // if looks like milliseconds, convert to seconds
            return n > 1e12 ? Math.floor(n / 1000) : n;
        }
        const s = String(val).trim();
        const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2}))?$/);
        if (m) {
            const y = Number(m[1]);
            const mo = Number(m[2]) - 1;
            const d = Number(m[3]);
            const hh = Number(m[4] || 0);
            const mm = Number(m[5] || 0);
            const dt = new Date(y, mo, d, hh, mm, 0);
            if (!isNaN(dt)) return Math.floor(dt.getTime() / 1000);
        }
        const dt2 = new Date(s.replace(' ', 'T'));
        if (!isNaN(dt2)) return Math.floor(dt2.getTime() / 1000);
        return null;
    };

    const formatUnixToReadable = (ts) => {
        if (!ts) return '';
        try {
            const n = Number(ts);
            if (isNaN(n)) return '';
            return new Date(n * 1000).toLocaleString();
        } catch (e) {
            return '';
        }
    };

    const handleDelete = async () => {
        if (!adminPwd) { MessagePlugin.error('请先填写管理员密码'); return; }
        if (!user) { MessagePlugin.error('请先获取用户'); return; }
        const res = await adminDeleteUserApi(user.user_id, adminPwd);
        if (!res) { MessagePlugin.error('请求失败'); return; }
        if (res.status === 200) { MessagePlugin.success('删除成功'); setUser(null); }
        else { MessagePlugin.error(res.msg || '删除失败'); }
    };

    const handleFetchList = async () => {
        if (!adminPwd) { MessagePlugin.error('请先填写管理员密码'); return; }
        try {
            const res = await adminListUsersApi(adminPwd, offset, limit);
            if (!res) { MessagePlugin.error('请求失败'); return; }
            if (res.status === 200) {
                setUsersList(res.data || []);
                MessagePlugin.success('获取列表成功');
            } else {
                MessagePlugin.error(res.msg || '获取列表失败');
            }
        } catch (e) {
            MessagePlugin.error('请求异常');
        }
    };

    const thStyle = { textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #ddd', background: '#fafafa' };
    const tdStyle = { padding: '8px 12px', verticalAlign: 'middle' };

    const openEditModal = (u) => {
        setEditForm({
            user_id: u.user_id,
            username: u.username || '',
            email: u.email || '',
            password: u.password || '',
            expire_time: u.expire_time || ''
        });
        setVisibleEdit(true);
    };

    const handleEditSave = async () => {
        if (!adminPwd) { MessagePlugin.error('请先填写管理员密码'); return; }
        const payload = { username: editForm.username, email: editForm.email, password: editForm.password, expire_time: editForm.expire_time };
        if (payload.expire_time) payload.expire_time = parseExpireToUnix(payload.expire_time);
        const res = await adminUpdateUserApi(editForm.user_id, payload, adminPwd);
        if (!res) { MessagePlugin.error('请求失败'); return; }
        if (res.status === 200) {
            // update in list
            setUsersList(prev => prev.map(it => it.user_id === res.data.user_id ? res.data : it));
            MessagePlugin.success('保存成功');
            setVisibleEdit(false);
            setUser(res.data);
        } else {
            MessagePlugin.error(res.msg || '保存失败');
        }
    };

    const handleDeleteRow = async (user_id) => {
        if (!adminPwd) { MessagePlugin.error('请先填写管理员密码'); return; }
        if (!window.confirm(`确认删除用户 ${user_id} ?`)) return;
        const res = await adminDeleteUserApi(user_id, adminPwd);
        if (!res) { MessagePlugin.error('请求失败'); return; }
        if (res.status === 200) {
            setUsersList(prev => prev.filter(it => it.user_id !== user_id));
            MessagePlugin.success('删除成功');
            if (user && user.user_id === user_id) setUser(null);
        } else {
            MessagePlugin.error(res.msg || '删除失败');
        }
    };

    const openQuotaModal = async (u) => {
        if (!adminPwd) { MessagePlugin.error('请先填写管理员密码'); return; }
        try {
            const res = await adminGetUserQuotaApi(u.user_id, adminPwd);
            if (res && res.status === 200) {
                setQuotaForm({ user_id: u.user_id, total_quota: res.data.total_quota || 0, used_quota: res.data.used_quota || 0 });
                setVisibleQuotaEdit(true);
            } else {
                MessagePlugin.error(res ? res.msg || '获取配额失败' : '请求失败');
            }
        } catch (e) {
            MessagePlugin.error('请求异常');
        }
    };

    const handleQuotaSave = async () => {
        if (!adminPwd) { MessagePlugin.error('请先填写管理员密码'); return; }
        try {
            const payload = { total_quota: quotaForm.total_quota, used_quota: quotaForm.used_quota };
            const res = await adminUpdateUserQuotaApi(quotaForm.user_id, payload, adminPwd);
            if (res && res.status === 200) {
                MessagePlugin.success('保存配额成功');
                setVisibleQuotaEdit(false);
                // update list
                setUsersList(prev => prev.map(it => it.user_id === res.data.user_id ? { ...it, total_quota: res.data.total_quota, used_quota: res.data.used_quota } : it));
            } else {
                MessagePlugin.error(res ? res.msg || '保存配额失败' : '请求失败');
            }
        } catch (e) {
            MessagePlugin.error('请求异常');
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>User Management</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                <div>
                    <Input placeholder="管理员密码 (x-admin-password)" value={adminPwd} onChange={saveAdminPwd} style={{ width: 360 }} />
                </div>

                <div>
                    <Input placeholder="user_id" value={userId} onChange={setUserId} style={{ width: 240 }} />
                    <Button theme="primary" onClick={handleFetch} style={{ marginLeft: 8 }}>查询用户</Button>
                    <Button onClick={() => setVisibleCreate(true)} style={{ marginLeft: 8 }}>创建用户</Button>
                </div>

                <div style={{ marginTop: 12 }}>
                    <Input placeholder="offset" value={offset} onChange={(v) => setOffset(Number(v) || 0)} style={{ width: 120 }} />
                    <Input placeholder="limit" value={limit} onChange={(v) => setLimit(Number(v) || 50)} style={{ width: 120, marginLeft: 8 }} />
                    <Button theme="default" onClick={handleFetchList} style={{ marginLeft: 8 }}>获取用户列表</Button>
                </div>

                {/* inline user edit removed; use modal editor instead */}

                {usersList && usersList.length > 0 && (
                    <div style={{ marginTop: 12, width: '100%', overflowX: 'auto' }}>
                        <h4>Users ({usersList.length})</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>user_id</th>
                                    <th style={thStyle}>username</th>
                                    <th style={thStyle}>email</th>
                                    <th style={thStyle}>total_quota</th>
                                    <th style={thStyle}>used_quota</th>
                                    <th style={thStyle}>expire_time</th>
                                    <th style={thStyle}>create_time</th>
                                    <th style={thStyle}>update_time</th>
                                    <th style={thStyle}>actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersList.map(u => (
                                    <tr key={u.user_id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={tdStyle}>{u.user_id}</td>
                                        <td style={tdStyle}>{u.username || ''}</td>
                                        <td style={tdStyle}>{u.email || ''}</td>
                                        <td style={tdStyle}>{u.expire_time ? formatUnixToReadable(u.expire_time) + ' (' + u.expire_time + ')' : '—'}</td>
                                                                                <td style={tdStyle}>{u.total_quota != null ? u.total_quota : '—'}</td>
                                                                                <td style={tdStyle}>{u.used_quota != null ? u.used_quota : '—'}</td>
                                                                                <td style={tdStyle}>{u.expire_time ? formatUnixToReadable(u.expire_time) + ' (' + u.expire_time + ')' : '—'}</td>
                                        <td style={tdStyle}>{u.create_time ? formatUnixToReadable(u.create_time) + ' (' + u.create_time + ')' : '—'}</td>
                                        <td style={tdStyle}>{u.update_time ? formatUnixToReadable(u.update_time) + ' (' + u.update_time + ')' : '—'}</td>
                                        <td style={tdStyle}>
                                            <Button size="small" onClick={() => openEditModal(u)}>编辑</Button>
                                            <Button size="small" onClick={() => openQuotaModal(u)} style={{ marginLeft: 8 }}>编辑配额</Button>
                                            <Button size="small" theme="danger" style={{ marginLeft: 8 }} onClick={() => handleDeleteRow(u.user_id)}>删除</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Quota modal */}
                <Dialog header="编辑配额" visible={visibleQuotaEdit} onClose={() => setVisibleQuotaEdit(false)}>
                    <div style={{ padding: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>user_id</label>
                                <Input value={quotaForm.user_id} disabled />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>总额度 (total_quota)</label>
                                <Input value={quotaForm.total_quota} onChange={(v) => setQuotaForm({ ...quotaForm, total_quota: Number(v) || 0 })} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>已用额度 (used_quota)</label>
                                <Input value={quotaForm.used_quota} onChange={(v) => setQuotaForm({ ...quotaForm, used_quota: Number(v) || 0 })} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Button theme="primary" onClick={handleQuotaSave}>保存</Button>
                                <Button onClick={() => setVisibleQuotaEdit(false)}>取消</Button>
                            </div>
                        </div>
                    </div>
                </Dialog>

                {/* Edit modal */}
                <Dialog header="编辑用户" visible={visibleEdit} onClose={() => setVisibleEdit(false)}>
                    <div style={{ padding: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>user_id</label>
                                <Input value={editForm.user_id} disabled />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>用户名</label>
                                <Input value={editForm.username || ''} onChange={(v) => setEditForm({ ...editForm, username: v })} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>邮箱</label>
                                <Input value={editForm.email || ''} onChange={(v) => setEditForm({ ...editForm, email: v })} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>密码</label>
                                <Input value={editForm.password || ''} onChange={(v) => setEditForm({ ...editForm, password: v })} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>过期时间</label>
                                <Input value={editForm.expire_time || ''} onChange={(v) => setEditForm({ ...editForm, expire_time: v })} />
                                <div style={{ marginTop: 6, color: '#666', fontSize: 12 }}>
                                    解析: {parseExpireToUnix(editForm.expire_time) || '—'}
                                    {parseExpireToUnix(editForm.expire_time) ? (' — ' + formatUnixToReadable(parseExpireToUnix(editForm.expire_time))) : ''}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Button theme="primary" onClick={handleEditSave}>保存</Button>
                                <Button onClick={() => setVisibleEdit(false)}>取消</Button>
                            </div>
                        </div>
                    </div>
                </Dialog>

                <Dialog header="创建用户" visible={visibleCreate} onClose={() => setVisibleCreate(false)}>
                    <div style={{ padding: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>user_id</label>
                                <Input value={createForm.user_id} onChange={(v) => setCreateForm({ ...createForm, user_id: v })} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>用户名</label>
                                <Input value={createForm.username} onChange={(v) => setCreateForm({ ...createForm, username: v })} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>邮箱</label>
                                <Input value={createForm.email} onChange={(v) => setCreateForm({ ...createForm, email: v })} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>密码</label>
                                <Input value={createForm.password} onChange={(v) => setCreateForm({ ...createForm, password: v })} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block' }}>过期时间</label>
                                <Input value={createForm.expire_time} onChange={(v) => setCreateForm({ ...createForm, expire_time: v })} />
                                <div style={{ marginTop: 6, color: '#666', fontSize: 12 }}>
                                    解析: {parseExpireToUnix(createForm.expire_time) || '—'}
                                    {parseExpireToUnix(createForm.expire_time) ? (' — ' + formatUnixToReadable(parseExpireToUnix(createForm.expire_time))) : ''}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Button theme="primary" onClick={handleCreate}>创建</Button>
                                <Button onClick={() => setVisibleCreate(false)}>取消</Button>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default UserManagement;
