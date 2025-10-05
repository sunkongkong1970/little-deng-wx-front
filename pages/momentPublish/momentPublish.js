Page({
	data: {
		content: '',
		images: [],
		location: null,
		canPublish: false
	},

	onLoad(options) {
		// 页面加载
	},

	/**
	 * 输入内容变化
	 */
	onContentChange(e) {
		const content = e.detail.value || '';
		this.setData({
			content,
			canPublish: content.trim().length > 0 || this.data.images.length > 0
		});
	},

	/**
	 * 选择图片
	 */
	chooseImage() {
		const maxCount = 9 - this.data.images.length;
		if (maxCount <= 0) {
			wx.showToast({
				title: '最多只能添加9张图片',
				icon: 'none'
			});
			return;
		}

		wx.chooseMedia({
			count: maxCount,
			mediaType: ['image'],
			sourceType: ['album', 'camera'],
			success: (res) => {
				const tempFiles = res.tempFiles.map(file => file.tempFilePath);
				const images = [...this.data.images, ...tempFiles];
				this.setData({
					images,
					canPublish: this.data.content.trim().length > 0 || images.length > 0
				});
			}
		});
	},

	/**
	 * 预览图片
	 */
	previewImage(e) {
		const index = e.currentTarget.dataset.index;
		wx.previewImage({
			current: this.data.images[index],
			urls: this.data.images
		});
	},

	/**
	 * 删除图片
	 */
	deleteImage(e) {
		const index = e.currentTarget.dataset.index;
		const images = this.data.images.filter((_, i) => i !== index);
		this.setData({
			images,
			canPublish: this.data.content.trim().length > 0 || images.length > 0
		});
	},

	/**
	 * 选择位置
	 */
	chooseLocation() {
		// 先检查位置权限
		wx.getSetting({
			success: (res) => {
				if (res.authSetting['scope.userLocation'] === false) {
					// 用户之前拒绝了位置权限，引导去设置
					wx.showModal({
						title: '位置权限未开启',
						content: '需要获取您的位置信息才能选择位置，请前往设置开启位置权限',
						confirmText: '去设置',
						cancelText: '取消',
						success: (modalRes) => {
							if (modalRes.confirm) {
								wx.openSetting({
									success: (settingRes) => {
										if (settingRes.authSetting['scope.userLocation']) {
											// 权限开启后，再次调用选择位置
											this.openLocationPicker();
										}
									}
								});
							}
						}
					});
				} else {
					// 有权限或未授权过，直接打开位置选择器
					this.openLocationPicker();
				}
			},
			fail: () => {
				// 获取设置失败，直接尝试打开位置选择器
				this.openLocationPicker();
			}
		});
	},

	/**
	 * 打开位置选择器
	 */
	openLocationPicker() {
		wx.chooseLocation({
			success: (res) => {
				console.log('选择位置成功：', res);
				// 保存位置信息
				const location = {
					name: res.name || res.address || '未知位置',
					address: res.address || '',
					latitude: res.latitude,
					longitude: res.longitude
				};
				
				this.setData({
					location
				});

				wx.showToast({
					title: '位置已选择',
					icon: 'success',
					duration: 1500
				});
			},
			fail: (err) => {
				console.log('选择位置失败：', err);
				
				// 处理各种错误情况
				if (err.errMsg.indexOf('auth deny') !== -1 || err.errMsg.indexOf('authorize') !== -1) {
					// 用户拒绝授权
					wx.showModal({
						title: '位置权限未授权',
						content: '需要授权位置信息才能选择位置，是否前往设置？',
						confirmText: '去设置',
						cancelText: '取消',
						success: (res) => {
							if (res.confirm) {
								wx.openSetting();
							}
						}
					});
				} else if (err.errMsg.indexOf('cancel') !== -1) {
					// 用户取消选择
					console.log('用户取消选择位置');
				} else {
					// 其他错误
					wx.showToast({
						title: '获取位置失败，请重试',
						icon: 'none',
						duration: 2000
					});
				}
			}
		});
	},

	/**
	 * 清除位置
	 */
	clearLocation(e) {
		// 阻止事件冒泡，避免触发选择位置
		if (e) {
			e.stopPropagation && e.stopPropagation();
		}
		
		wx.showModal({
			title: '提示',
			content: '确定要清除位置信息吗？',
			confirmText: '确定',
			cancelText: '取消',
			success: (res) => {
				if (res.confirm) {
					this.setData({
						location: null
					});
					wx.showToast({
						title: '位置已清除',
						icon: 'success',
						duration: 1500
					});
				}
			}
		});
	},

	/**
	 * 发布动态
	 */
	onPublish() {
		if (!this.data.canPublish) {
			wx.showToast({
				title: '请输入内容或添加图片',
				icon: 'none'
			});
			return;
		}

		// 准备发布数据
		const publishData = {
			content: this.data.content.trim(),
			images: this.data.images,
			location: this.data.location,
			createTime: new Date().getTime()
		};

		console.log('发布动态数据：', publishData);

		// 显示加载提示
		wx.showLoading({
			title: '发布中...',
			mask: true
		});

		// TODO: 这里应该调用实际的 API 接口
		// 例如：
		// wx.request({
		//   url: 'your-api-endpoint',
		//   method: 'POST',
		//   data: publishData,
		//   success: (res) => { ... },
		//   fail: (err) => { ... }
		// });

		// 暂时模拟网络请求
		setTimeout(() => {
			wx.hideLoading();
			
			// 模拟发布成功
			wx.showToast({
				title: '发布成功',
				icon: 'success',
				duration: 1500
			});

			// 延迟返回上一页
			setTimeout(() => {
				// 返回上一页并刷新
				const pages = getCurrentPages();
				if (pages.length > 1) {
					const prevPage = pages[pages.length - 2];
					if (prevPage.route === 'pages/moment/moment') {
						// 通知上一页刷新数据
						if (typeof prevPage.onShow === 'function') {
							prevPage.setData({
								needRefresh: true
							});
						}
					}
				}
				wx.navigateBack();
			}, 1500);
		}, 1000);
	},

	/**
	 * 取消发布
	 */
	onCancel() {
		// 检查是否有内容、图片或位置信息
		const hasContent = this.data.content.trim().length > 0;
		const hasImages = this.data.images.length > 0;
		const hasLocation = this.data.location !== null;

		if (hasContent || hasImages || hasLocation) {
			wx.showModal({
				title: '提示',
				content: '确定要放弃本次编辑吗？',
				confirmText: '确定',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						wx.navigateBack();
					}
				}
			});
		} else {
			wx.navigateBack();
		}
	}
});
