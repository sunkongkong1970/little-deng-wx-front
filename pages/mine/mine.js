import api from '../../api.js';

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    userInfo: {
      avatarUrl: '', // 初始为空，加载时再设置真实头像或默认头像
      localAvatarUrl: '',
      nickname: '未登录',
      roleName: '未知',
      isHouseholder: false
    },
    inviteCode: '',
    showEditSheet: false,
    showInviteSheet: false,
    roleOptions: [],
    rolePickerValue: [],
    roleLabel: '请选择角色',
    editingNickname: false,
    saving: false,
    generating: false
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    // 更新自定义 tabBar
    this.updateTabBar();
    this.loadUserInfo();
  },

  /**
   * 更新自定义 tabBar
   */
  updateTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const userInfo = wx.getStorageSync('userInfo') || {};
      const isHouseholder = userInfo.isHouseholder || false;
      
      // 根据是否是管理员计算当前页面的索引
      // 如果是管理员："宝宝"=0, "时光"=1, "应用"=2, "我的"=3
      // 如果不是管理员："时光"=0, "应用"=1, "我的"=2
      const selected = isHouseholder ? 3 : 2;
      
      this.getTabBar().setData({
        selected: selected
      });
      this.getTabBar().updateTabBar();
    }
  },

  // 辅助函数：为 base64 数据添加前缀
  formatBase64Image(base64Data) {
    if (!base64Data) return '';
    // 确保是字符串类型
    if (typeof base64Data !== 'string') {
      console.warn('formatBase64Image: base64Data 不是字符串类型', typeof base64Data);
      return '';
    }
    // 如果已经有前缀，直接返回
    if (base64Data.startsWith('data:image')) return base64Data;
    // 如果是 http/https 链接，直接返回
    if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) return base64Data;
    // 如果是本地路径，直接返回（排除 base64 数据，如 /9j/ 开头的 JPEG）
    if (base64Data.startsWith('wxfile://')) return base64Data;
    // 否则添加 base64 前缀（自动识别 JPEG 或 PNG）
    // JPEG 的 base64 通常以 /9j/ 开头，PNG 通常以 iVBORw 开头
    const imageType = base64Data.startsWith('/9j/') ? 'jpeg' : 'png';
    return `data:image/${imageType};base64,${base64Data}`;
  },

  // 加载用户信息
  async loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const token = wx.getStorageSync('token') || '';
    console.log(userInfo)
    console.log(token)
    const nickname = wx.getStorageSync('nickname') || userInfo.userName || '未登录';
    // 注意：这里不设置默认值，保持原始的空值，以便正确判断是否需要从服务器获取
    let avatarUrl = wx.getStorageSync('avatarUrl') || userInfo.avatarUrl || '';
    let localAvatarPath = wx.getStorageSync('localAvatarPath') || '';
    const inviteCode = wx.getStorageSync('inviteCode') || '';

    console.log("缓存的avatarUrl: " + avatarUrl)
    console.log("本地avatarPath: " + localAvatarPath)
    
    // 判断缓存中的头像是否是默认头像或微信临时头像URL，如果是则忽略
    if (avatarUrl === defaultAvatarUrl) {
      console.log('缓存的头像是默认头像，将忽略并重新获取');
      avatarUrl = '';
    }
    // 如果是微信头像 URL（http/https开头），也视为临时头像，需要从服务器获取真实的 base64 头像
    if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
      console.log('缓存的是微信临时头像URL，将从服务器获取真实头像');
      avatarUrl = '';
    }
    if (localAvatarPath === defaultAvatarUrl) {
      console.log('本地头像路径是默认头像，将忽略并重新获取');
      localAvatarPath = '';
    }
    if (localAvatarPath && (localAvatarPath.startsWith('http://') || localAvatarPath.startsWith('https://'))) {
      console.log('本地头像路径是微信临时URL，将从服务器获取真实头像');
      localAvatarPath = '';
    }
    
    // 如果缓存中没有真实头像（或只有默认头像），则从服务器获取
    if (!avatarUrl && !localAvatarPath && token) {
      try {
        console.log('缓存中没有真实头像，从服务器获取...');
        const avatarData = await api.getUserAvatar(token);
        console.log('获取到的头像数据:', avatarData);
        
        if (avatarData) {
          // avatarData 是一个对象 { userAvatarUrl, userAvatarBase64 }
          // 优先使用 userAvatarUrl（URL格式），其次使用 userAvatarBase64
          let avatarToUse = '';
          
          if (avatarData.userAvatarUrl) {
            avatarToUse = avatarData.userAvatarUrl;
            console.log('使用 userAvatarUrl:', avatarToUse);
          } else if (avatarData.userAvatarBase64) {
            // 为 base64 数据添加前缀
            avatarToUse = this.formatBase64Image(avatarData.userAvatarBase64);
            console.log('使用 userAvatarBase64（已格式化）');
          }
          
          if (avatarToUse) {
            // 缓存头像数据
            wx.setStorageSync('avatarUrl', avatarToUse);
            avatarUrl = avatarToUse;
            
            // 同步更新 userInfo 缓存
            userInfo.avatarUrl = avatarToUse;
            wx.setStorageSync('userInfo', userInfo);
            
            console.log('头像获取成功并已缓存');
          } else {
            console.log('接口返回头像数据为空');
          }
        } else {
          console.log('接口返回数据为空');
        }
      } catch (err) {
        console.error('获取用户头像失败:', err);
      }
    }

    // 格式化已有的头像数据（确保有正确的前缀）
    if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('wxfile://') && !avatarUrl.startsWith('data:image')) {
      avatarUrl = this.formatBase64Image(avatarUrl);
    }
    if (localAvatarPath && !localAvatarPath.startsWith('http') && !localAvatarPath.startsWith('wxfile://') && !localAvatarPath.startsWith('data:image')) {
      localAvatarPath = this.formatBase64Image(localAvatarPath);
    }

    // 最后：如果还是没有头像，使用默认头像（仅用于显示，不缓存）
    const finalAvatarUrl = avatarUrl || defaultAvatarUrl;
    const finalLocalAvatarUrl = localAvatarPath || avatarUrl || defaultAvatarUrl;

    this.setData({
      'userInfo.nickname': nickname,
      'userInfo.avatarUrl': finalAvatarUrl,
      'userInfo.localAvatarUrl': finalLocalAvatarUrl,
      'userInfo.roleName': userInfo.userRoleName || '未知',
      'userInfo.isHouseholder': userInfo.isHouseholder || false,
      inviteCode: inviteCode
    });
  },

  // 打开编辑弹窗
  onEdit() {
    this.setData({
      showEditSheet: true
    });
    this.loadRoleOptions();
  },

  // 关闭编辑弹窗
  onEditSheetClose() {
    this.setData({
      showEditSheet: false,
      editingNickname: false
    });
  },

  // 加载角色选项
  loadRoleOptions() {
    const api = require('../../api.js').default || require('../../api.js');
    api.getRoleOptions('role').then((res) => {
      const raw = (res && (res.data || res)) || {};
      let labels = [];
      if (Array.isArray(raw)) {
        labels = raw.map((item, index) => {
          if (typeof item === 'string' || typeof item === 'number') {
            const str = String(item);
            return { label: str, value: str };
          }
          if (item && typeof item === 'object') {
            if ('label' in item && 'value' in item) {
              return { label: String(item.label), value: String(item.value) };
            }
            if ('name' in item && ('id' in item || 'value' in item || 'code' in item)) {
              const v = item.id ?? item.value ?? item.code;
              return { label: String(item.name), value: String(v) };
            }
            if ('roleName' in item && ('roleId' in item || 'id' in item)) {
              const v = item.roleId ?? item.id;
              return { label: String(item.roleName), value: String(v) };
            }
            const firstKey = Object.keys(item)[0];
            const firstVal = firstKey ? item[firstKey] : index;
            return { label: String(firstVal), value: String(firstKey ?? index) };
          }
          return { label: String(index), value: String(index) };
        });
      } else if (raw && typeof raw === 'object') {
        labels = Object.entries(raw).map(([roleId, roleName]) => ({
          label: String(roleName),
          value: String(roleId)
        }));
      }
      
      console.log('=== 角色选项详情 ===');
      labels.forEach((item, index) => {
        console.log(`索引 ${index}: label="${item.label}", value="${item.value}"`);
      });
      
      console.log('=== 角色选项加载完成 ===');
      
      // 定位到当前用户的角色
      const currentRoleName = this.data.userInfo.roleName || '';
      console.log(`当前用户角色: ${currentRoleName}`);
      
      // 根据角色名称查找对应的选项
      let initialIndex = -1;
      if (currentRoleName && currentRoleName !== '未知') {
        initialIndex = labels.findIndex(item => item.label === currentRoleName);
        console.log(`根据角色名称"${currentRoleName}"查找，索引=${initialIndex}`);
      }
      
      // 如果没找到当前角色，则使用默认定位（第3个选项或最后一个）
      if (initialIndex === -1) {
        const len = labels.length;
        initialIndex = len >= 3 ? 2 : (len > 0 ? len - 1 : -1);
        console.log(`未找到当前角色，使用默认定位，索引=${initialIndex}`);
      }
      
      const initialValue = initialIndex >= 0 ? [labels[initialIndex].value] : [];
      const initialLabel = initialIndex >= 0 ? labels[initialIndex].label : '请选择角色';
      
      console.log(`初始定位: 索引=${initialIndex}, value=${initialValue[0]}, label=${initialLabel}`);
      
      this.setData({
        roleOptions: labels,
        rolePickerValue: initialValue,
        roleLabel: initialLabel
      }, () => {
        if (!this.data.roleOptions.length) {
          wx.showToast({ title: '角色数据为空', icon: 'none' });
        } else {
          console.log(`角色选项已加载，初始选中: ${initialLabel}`);
        }
      });
    }).catch((err) => {
      console.error('加载角色选项失败:', err);
    })
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail || {};
    if (!avatarUrl) return;
    
    try {
      const fs = wx.getFileSystemManager();
      const savePath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.png`;
      fs.saveFileSync(avatarUrl, savePath);
      this.setData({
        'userInfo.localAvatarUrl': savePath
      });
      wx.setStorageSync('localAvatarPath', savePath);
    } catch (err) {
      this.setData({
        'userInfo.localAvatarUrl': avatarUrl
      });
      wx.setStorageSync('localAvatarPath', avatarUrl);
    }
  },

  // 昵称输入
  onNicknameChange(e) {
    this.setData({
      'userInfo.nickname': e.detail.value || ''
    });
  },

  // 点击昵称编辑
  onNicknameTap() {
    this.setData({
      editingNickname: true
    });
  },

  // 昵称失焦
  onNicknameBlur() {
    this.setData({
      editingNickname: false
    });
  },

  // 角色选择
  onRoleChange(e) {
    const {
      value,
      label
    } = e.detail;
    
    console.log('=== 角色选择变更事件 ===');
    console.log('事件类型:', e.type);
    console.log('事件返回 - value:', value, 'label:', label);
    
    // 使用 label 来查找对应的 value（因为 label 是用户看到并选择的）
    let actualValue = value;
    let actualLabel = (label && label[0]) || '请选择角色';
    
    if (label && label[0]) {
      // 根据 label 查找对应的选项，这是用户实际选择的
      const selectedByLabel = this.data.roleOptions.find(opt => opt.label === label[0]);
      console.log('根据 label 查找到的选项:', selectedByLabel);
      
      if (selectedByLabel) {
        // 使用 label 对应的 value，而不是事件中的 value
        actualValue = [selectedByLabel.value];
        actualLabel = selectedByLabel.label;
        console.log('实际应该使用的值:', { value: actualValue, label: actualLabel });
      }
    }
    
    this.setData({
      rolePickerValue: actualValue,
      roleLabel: actualLabel
    }, () => {
      console.log('更新后 - rolePickerValue:', this.data.rolePickerValue, 'roleLabel:', this.data.roleLabel);
    });
  },

  // 保存个人信息
  async onSaveProfile() {
    if (this.data.saving) return;

    const nickname = this.data.userInfo.nickname || '';
    const roleLabel = this.data.roleLabel;

    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    if (!roleLabel || roleLabel === '请选择角色') {
      wx.showToast({
        title: '请选择角色',
        icon: 'none'
      });
      return;
    }

    this.setData({ saving: true });

    console.log('=== 提交保存个人信息 ===');
    console.log('当前 rolePickerValue:', this.data.rolePickerValue);
    console.log('当前 roleLabel:', this.data.roleLabel);
    console.log('即将提交的角色 ID:', this.data.rolePickerValue[0]);
    console.log('显示的角色名称:', this.data.roleLabel);

    try {
      const token = wx.getStorageSync('token') || '';
      const avatarPath = this.data.userInfo.localAvatarUrl || this.data.userInfo.avatarUrl;
      let avatarBase64 = '';
      let hasNewAvatar = false;  // 标记是否有新头像

      // 读取头像base64
      if (avatarPath) {
        if (avatarPath.startsWith('wxfile://') || avatarPath.startsWith(wx.env.USER_DATA_PATH)) {
          // 如果是本地文件路径，读取文件
          try {
            const fs = wx.getFileSystemManager();
            const fileContent = fs.readFileSync(avatarPath, 'base64');
            if (fileContent) {
              avatarBase64 = fileContent;
              hasNewAvatar = true;
            }
          } catch (err) {
            console.error('读取头像文件失败:', err);
          }
        } else if (avatarPath.startsWith('data:image')) {
          // 如果是已格式化的 base64，提取纯 base64 部分
          const base64Match = avatarPath.match(/base64,(.+)/);
          if (base64Match && base64Match[1]) {
            avatarBase64 = base64Match[1];
            // 不标记为新头像，因为这是已有的
          }
        }
      }

      // 先上传头像获取URL（仅当有新头像时）
      let avatarUrl = '';
      if (hasNewAvatar && avatarPath && (avatarPath.startsWith('wxfile://') || avatarPath.startsWith(wx.env.USER_DATA_PATH))) {
        try {
          console.log('开始上传头像...');
          avatarUrl = await api.uploadImageFile(token, 'USER_AVATAR', avatarPath);
          console.log('头像上传成功，URL:', avatarUrl);
        } catch (uploadErr) {
          console.error('上传头像失败:', uploadErr);
          // 上传失败不阻断流程，继续提交
        }
      }
      
      // 调用更新接口（使用 editUser 接口更新资料）
      console.log('调用 editUser 接口，roleId:', this.data.rolePickerValue[0]);
      console.log('头像数据:', hasNewAvatar ? '有新头像' : (avatarBase64 ? '使用已有头像' : '无头像'));
      console.log('头像URL:', avatarUrl || '无');
      
      await api.editUser(
        token,
        nickname,
        this.data.rolePickerValue[0],
        avatarBase64,
        avatarUrl
      );

      // 更新缓存
      wx.setStorageSync('nickname', nickname);
      const cachedUserInfo = wx.getStorageSync('userInfo') || {};
      cachedUserInfo.userName = nickname;
      cachedUserInfo.userRoleName = roleLabel;
      
      // 保留当前头像（无论是否更新）
      const currentAvatar = this.data.userInfo.avatarUrl || wx.getStorageSync('avatarUrl');
      if (currentAvatar) {
        cachedUserInfo.avatarUrl = currentAvatar;
        wx.setStorageSync('avatarUrl', currentAvatar);
      }
      
      wx.setStorageSync('userInfo', cachedUserInfo);

      console.log('缓存已更新:', { nickname, roleLabel });

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      this.setData({
        saving: false,
        showEditSheet: false
      });

      // 重新加载用户信息（异步执行）
      await this.loadUserInfo();
    } catch (err) {
      console.error('保存失败:', err);
      this.setData({ saving: false });
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none'
      });
    }
  },

  // 打开邀请码弹窗
  async onShowInviteCode() {
    await this.generateInviteCode();
  },

  // 生成邀请码
  async generateInviteCode() {
    if (this.data.generating) return;

    this.setData({ generating: true });

    try {
      const token = wx.getStorageSync('token') || '';
      const code = await api.getHomeCode(token);
    
      this.setData({
        inviteCode: code,
        showInviteSheet: true,
        generating: false
      });

      wx.showToast({
        title: '邀请码已生成',
        icon: 'success'
      });
    } catch (err) {
      console.error('生成邀请码失败:', err);
      this.setData({ generating: false });
      wx.showToast({
        title: err.message || '生成失败',
        icon: 'none'
      });
    }
  },

  // 关闭邀请码弹窗
  onInviteSheetClose() {
    this.setData({
      showInviteSheet: false
    });
  },

  // 复制邀请码
  onCopyInviteCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 点击家庭管理/家庭信息
   */
  onFamilyManage() {
    const isHouseholder = this.data.userInfo.isHouseholder || false;
    wx.navigateTo({
      url: `/pages/familyDetail/familyDetail?isHouseholder=${isHouseholder}`
    });
  }
});
