Page({
  data: {
    code: '',
    canJoin: false,
    showSheet: false,
    nickname: '',
    avatarUrl: '',
    roleOptions: [],
    rolePickerValue: [],
    roleLabel: '请选择角色',
    saving: false,
    // 创建家庭模式开关与家庭名称
    createMode: false,
    familyName: ''
  },
  onCodeChange(e) {
    const value = e.detail.value || '';
    this.setData({
      code: value,
      canJoin: value.length >= 6
    });
  },
  onJoin() {
    this.openProfileSheet();
  },
  onAdd() {
    // 进入创建家庭模式，打开底部弹窗
    this.openProfileSheet(true);
  },
  openProfileSheet(create = false) {
    // 默认从微信获取昵称头像
    this.fetchDefaultProfile();
    // 拉取角色选项
    this.loadRoleOptions();
    this.setData({
      showSheet: true,
      createMode: !!create
    });
  },
  onSheetVisibleChange(e) {
    this.setData({
      showSheet: e.detail.visible
    });
  },
  fetchDefaultProfile() {
    const that = this;
    wx.getUserProfile ? wx.getUserProfile({
      desc: '用于完善资料',
      success(res) {
        const info = res.userInfo || {};
        that.setData({
          nickname: info.nickName || ''
        });
        // 远程头像下载并缓存
        if (info.avatarUrl) {
          wx.downloadFile({
            url: info.avatarUrl,
            success(d) {
              
              const temp = d.tempFilePath;
              try {
                const fs = wx.getFileSystemManager();
                const savePath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.png`;
                fs.saveFileSync(temp, savePath);
                that.setData({
                  avatarUrl: savePath
                });
                wx.setStorageSync('localAvatarPath', savePath);
              } catch (err) {
                that.setData({
                  avatarUrl: temp
                });
              }
            }
          })
        }
      },
      fail() {
        that.getSettingProfileFallback();
      }
    }) : this.getSettingProfileFallback();
  },
  getSettingProfileFallback() {
    const that = this;
    wx.getSetting({
      success() {
        wx.getUserInfo({
          success(res) {
            const info = res.userInfo || {};
            that.setData({
              nickname: info.nickName || ''
            });
            if (info.avatarUrl) {
              wx.downloadFile({
                url: info.avatarUrl,
                success(d) {
                  const temp = d.tempFilePath;
                  try {
                    const fs = wx.getFileSystemManager();
                    const savePath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.png`;
                    fs.saveFileSync(temp, savePath);
                    that.setData({
                      avatarUrl: savePath
                    });
                    wx.setStorageSync('localAvatarPath', savePath);
                  } catch (err) {
                    that.setData({
                      avatarUrl: temp
                    });
                  }
                }
              })
            }
          }
        })
      }
    })
  },
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
      // 根据数据条数设置首次定位：>=3 定位到第3条，否则定位到最后一条
      const len = labels.length;
      const initialIndex = len >= 3 ? 2 : (len > 0 ? len - 1 : -1);
      const initialValue = initialIndex >= 0 ? [labels[initialIndex].value] : [];
      const initialLabel = initialIndex >= 0 ? labels[initialIndex].label : '请选择角色';
      this.setData({
        roleOptions: labels,
        rolePickerValue: initialValue,
        roleLabel: initialLabel
      }, () => {
        if (!this.data.roleOptions.length) {
          wx.showToast({ title: '角色数据为空', icon: 'none' });
        }
      });
    }).catch((err) => {
    })
  },
  onNicknameChange(e) {
    this.setData({
      nickname: e.detail.value || ''
    });
  },
  onRoleChange(e) {
    const {
      value,
      label
    } = e.detail;
    this.setData({
      rolePickerValue: value,
      roleLabel: (label && label[0]) || '请选择角色'
    });
  },
  onRoleConfirm(e) {
    const { value, label } = e.detail || {};
    this.setData({
      rolePickerValue: value || this.data.rolePickerValue,
      roleLabel: (label && label[0]) || this.data.roleLabel
    });
  },
  onFamilyNameChange(e) {
    this.setData({
      familyName: e.detail.value || ''
    });
  },
  onChooseAvatar(e) {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success(res) {
        const filePath = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (!filePath) return;
        // 缓存到本地
        const fs = wx.getFileSystemManager();
        const savePath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.png`;
        try {
          fs.saveFileSync(filePath, savePath);
          that.setData({
            avatarUrl: savePath
          });
          wx.setStorageSync('localAvatarPath', savePath);
        } catch (err) {
          that.setData({
            avatarUrl: filePath
          });
        }
      }
    })
  },
  onConfirmProfile() {
    if (this.data.saving) return;
    const roleLabel = this.data.roleLabel;
    const roleName = roleLabel || '';
    const nickname = this.data.nickname || '';
    if (!roleName) {
      wx.showToast({
        title: '请选择角色',
        icon: 'none'
      });
      return;
    }
    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    if (this.data.createMode && !this.data.familyName) {
      wx.showToast({
        title: '请输入家庭名称',
        icon: 'none'
      });
      return;
    }
    this.setData({
      saving: true
    });
    const api = require('../../api.js').default || require('../../api.js');
    const token = wx.getStorageSync('token') || '';
    console.log(token)
    const homeCode = this.data.code || '';
    // 创建家庭与加入家庭分支
    if (this.data.createMode) {
      // 创建家庭
      api.createHome(token, this.data.familyName).then(() => {
        const localAvatarPath = wx.getStorageSync('localAvatarPath') || '';
        wx.setStorageSync('profile', {
          roleName,
          nickname,
          avatarLocal: localAvatarPath,
          familyName: this.data.familyName
        });
        wx.showToast({ title: '家庭创建成功' });
        this.setData({ showSheet: false, saving: false });
        wx.navigateTo({ url: '/pages/roleSetting/roleSetting' });
      }).catch(err => {
        this.setData({ saving: false });
        wx.showToast({
          title: (err && err.message) || '创建家庭失败',
          icon: 'none'
        });
      });
    } else {
      api.userJoinHome({
        token,
        homeCode,
        userRole: roleName,
        userName: nickname
      }).then((res) => {
        if (res && typeof res.code !== 'undefined' && res.code !== 0) {
          this.setData({
            saving: false
          });
          wx.showToast({
            title: res.message || '加入失败',
            icon: 'none'
          });
          return;
        }
        const localAvatarPath = wx.getStorageSync('localAvatarPath') || '';
        wx.setStorageSync('profile', {
          roleName,
          nickname,
          avatarLocal: localAvatarPath
        });
        wx.showToast({
          title: '已保存'
        });
        this.setData({
          showSheet: false,
          saving: false
        });
        // 继续加入家庭流程
        wx.navigateTo({
          url: '/pages/roleSetting/roleSetting'
        });
      }).catch(err => {
        this.setData({
          saving: false
        });
        wx.showToast({
          title: (err && err.message) || '保存失败',
          icon: 'none'
        });
      });
    }
  }
});