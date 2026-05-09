/**
 * Qiaodoumayijiang - 主逻辑
 * 版本 1.2.0 - 支持 Shift 多选、已导入标记、删除功能
 */

(function() {
    'use strict';

    // ==================== 配置 ====================
    const CONFIG = {
        assetsDir: '',  // 启动时初始化
        manifestFile: 'manifest.json',
        supportedImages: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.tif'],
        supportedVideos: ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'],
        supportedAudio: ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.flac'],
        autoRefreshInterval: 2000,  // 自动检测间隔（毫秒）
        videoThumbnailTime: 0.5     // 视频截取时间点（秒）
    };

    // CEP 接口
    const csInterface = new CSInterface();
    
    // Node.js 模块
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    // 状态
    let currentAssets = [];
    let filteredAssets = [];  // 当前筛选后的素材列表（用于 Shift 选择）
    let selectedAssets = new Set();
    let lastClickedIndex = -1;  // 上次点击的索引（用于 Shift 多选）
    let importedAssets = new Set();  // 已导入到 AE 项目的素材
    let fileWatcher = null;
    let lastFileCount = 0;
    let autoRefreshTimer = null;

    // 视频缩略图缓存
    const videoThumbnailCache = new Map();

    // DOM 元素
    let elements = {};

    // ==================== 初始化 ====================

    function init() {
        // 初始化默认目录
        const homeDir = os.homedir();
        CONFIG.assetsDir = path.join(homeDir, 'Qiaodoumayijiang');

        // 获取 DOM 元素
        elements = {
            assetsDir: document.getElementById('assetsDir'),
            browseDirBtn: document.getElementById('browseDirBtn'),
            filterSelect: document.getElementById('filterSelect'),
            scanFolderBtn: document.getElementById('scanFolderBtn'),
            assetsGrid: document.getElementById('assetsGrid'),
            emptyState: document.getElementById('emptyState'),
            selectionCount: document.getElementById('selectionCount'),
            deleteBtn: document.getElementById('deleteBtn'),
            importProjectBtn: document.getElementById('importProjectBtn'),
            importCompBtn: document.getElementById('importCompBtn'),
            statusText: document.getElementById('statusText'),
            autoRefreshIndicator: document.getElementById('autoRefreshIndicator')
        };

        // 显示目录
        elements.assetsDir.value = CONFIG.assetsDir;

        // 绑定事件
        elements.scanFolderBtn.addEventListener('click', scanFolder);
        elements.filterSelect.addEventListener('change', renderAssets);
        elements.browseDirBtn.addEventListener('click', browseDir);
        elements.deleteBtn.addEventListener('click', deleteSelectedAssets);
        elements.importProjectBtn.addEventListener('click', () => importAssets(false));
        elements.importCompBtn.addEventListener('click', () => importAssets(true));

        // 加载设置
        loadSettings();

        // 初始加载
        loadAssets();

        // 启动自动刷新监听
        startAutoRefresh();

        // 检查已导入的素材
        checkImportedAssets();
    }

    // ==================== 检查已导入素材 ====================

    function checkImportedAssets() {
        const script = `
            (function() {
                var items = [];
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item instanceof FootageItem && item.file) {
                        items.push(item.file.fsName.replace(/\\\\/g, '/'));
                    }
                }
                return JSON.stringify(items);
            })();
        `;

        csInterface.evalScript(script, (result) => {
            try {
                const importedPaths = JSON.parse(result);
                importedAssets.clear();
                
                importedPaths.forEach(importedPath => {
                    // 标准化路径比较
                    const normalizedPath = importedPath.toLowerCase().replace(/\\/g, '/');
                    currentAssets.forEach(asset => {
                        const assetPath = asset.fullPath.toLowerCase().replace(/\\/g, '/');
                        if (assetPath === normalizedPath) {
                            importedAssets.add(asset.id);
                        }
                    });
                });

                // 更新 UI 显示已导入标记
                updateImportedBadges();
            } catch(e) {
                console.log('检查已导入素材失败:', e);
            }
        });
    }

    function updateImportedBadges() {
        document.querySelectorAll('.asset-card').forEach(card => {
            const assetId = card.dataset.assetId;
            let badge = card.querySelector('.imported-badge');
            
            if (importedAssets.has(assetId)) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'imported-badge';
                    badge.textContent = '已导入';
                    card.appendChild(badge);
                }
            } else {
                if (badge) {
                    badge.remove();
                }
            }
        });
    }

    // ==================== 自动刷新监听 ====================

    function startAutoRefresh() {
        // 清除旧的监听
        stopAutoRefresh();

        // 使用定时轮询方式检测文件变化（更稳定）
        autoRefreshTimer = setInterval(() => {
            checkForNewFiles();
        }, CONFIG.autoRefreshInterval);

        console.log('自动刷新已启动');
    }

    function stopAutoRefresh() {
        if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
        if (fileWatcher) {
            fileWatcher.close();
            fileWatcher = null;
        }
    }

    function checkForNewFiles() {
        try {
            // 统计当前目录下的文件数量
            let currentCount = 0;
            const subdirs = ['images', 'videos', 'audio', ''];
            
            subdirs.forEach(subdir => {
                const dirPath = subdir ? path.join(CONFIG.assetsDir, subdir) : CONFIG.assetsDir;
                if (fs.existsSync(dirPath)) {
                    try {
                        const files = fs.readdirSync(dirPath);
                        files.forEach(filename => {
                            const ext = path.extname(filename).toLowerCase();
                            if (CONFIG.supportedImages.includes(ext) ||
                                CONFIG.supportedVideos.includes(ext) ||
                                CONFIG.supportedAudio.includes(ext)) {
                                currentCount++;
                            }
                        });
                    } catch(e) {}
                }
            });

            // 如果文件数量变化，自动扫描文件夹
            if (lastFileCount !== 0 && currentCount !== lastFileCount) {
                console.log(`检测到文件变化: ${lastFileCount} -> ${currentCount}`);
                setStatus('检测到新文件，正在扫描...');
                
                // 闪烁指示器
                if (elements.autoRefreshIndicator) {
                    elements.autoRefreshIndicator.style.color = '#FFD700';
                    setTimeout(() => {
                        elements.autoRefreshIndicator.style.color = '#4CAF50';
                    }, 500);
                }
                
                // 执行扫描（而不是只读取 manifest）
                scanFolderInternal();
                updateManifest();
                renderAssets();
                updateSelectionCount();
                checkImportedAssets();  // 重新检查已导入状态
                setStatus(`共 ${currentAssets.length} 个素材 (自动监听中)`);
            }
            
            lastFileCount = currentCount;
        } catch(e) {
            console.log('检测文件变化失败:', e);
        }
    }

    // ==================== 设置管理 ====================

    function loadSettings() {
        try {
            const settingsPath = path.join(os.homedir(), 'Qiaodoumayijiang_settings.json');
            if (fs.existsSync(settingsPath)) {
                const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                if (settings.assetsDir && fs.existsSync(settings.assetsDir)) {
                    CONFIG.assetsDir = settings.assetsDir;
                    elements.assetsDir.value = CONFIG.assetsDir;
                }
            }
        } catch(e) {
            console.log('加载设置失败:', e);
        }
    }

    function saveSettings() {
        try {
            const settingsPath = path.join(os.homedir(), 'Qiaodoumayijiang_settings.json');
            fs.writeFileSync(settingsPath, JSON.stringify({ assetsDir: CONFIG.assetsDir }), 'utf8');
        } catch(e) {
            console.log('保存设置失败:', e);
        }
    }

    // ==================== 目录选择 ====================

    function browseDir() {
        // 使用 CEP 的文件选择对话框
        const result = window.cep.fs.showOpenDialogEx(false, true, '选择素材目录', CONFIG.assetsDir, null);
        if (result.data && result.data.length > 0) {
            CONFIG.assetsDir = result.data[0];
            elements.assetsDir.value = CONFIG.assetsDir;
            saveSettings();
            
            // 重置计数器并重新加载
            lastFileCount = 0;
            videoThumbnailCache.clear();
            loadAssets();
            
            // 重启自动刷新
            startAutoRefresh();
        }
    }

    // ==================== 素材加载 ====================

    function loadAssets() {
        setStatus('正在扫描...');
        currentAssets = [];
        selectedAssets.clear();
        lastClickedIndex = -1;

        // 直接扫描文件夹（确保能发现新文件）
        scanFolderInternal();
        
        // 更新 manifest
        updateManifest();

        renderAssets();
        updateSelectionCount();
        checkImportedAssets();  // 检查已导入状态
        setStatus(`共 ${currentAssets.length} 个素材 (自动监听中)`);
    }

    // ==================== 文件夹扫描 ====================

    function scanFolder() {
        setStatus('正在扫描文件夹...');
        scanFolderInternal();
        
        // 更新 manifest.json
        updateManifest();
        
        renderAssets();
        checkImportedAssets();
        setStatus(`扫描完成，共 ${currentAssets.length} 个素材`);
    }

    function scanFolderInternal() {
        currentAssets = [];

        // 扫描子目录
        const subdirs = ['images', 'videos', 'audio', ''];  // 空字符串表示根目录
        
        subdirs.forEach(subdir => {
            const dirPath = subdir ? path.join(CONFIG.assetsDir, subdir) : CONFIG.assetsDir;
            
            if (!fs.existsSync(dirPath)) return;

            try {
                const files = fs.readdirSync(dirPath);
                
                files.forEach(filename => {
                    const ext = path.extname(filename).toLowerCase();
                    const fullPath = path.join(dirPath, filename);
                    
                    // 检查是否是文件
                    const stat = fs.statSync(fullPath);
                    if (!stat.isFile()) return;

                    // 判断类型
                    let type = null;
                    if (CONFIG.supportedImages.includes(ext)) {
                        type = 'image';
                    } else if (CONFIG.supportedVideos.includes(ext)) {
                        type = 'video';
                    } else if (CONFIG.supportedAudio.includes(ext)) {
                        type = 'audio';
                    }

                    if (type) {
                        const relativePath = subdir ? `${subdir}/${filename}` : filename;
                        const id = path.basename(filename, ext) + '_' + stat.mtimeMs;  // 使用修改时间确保唯一性

                        // 检查是否已存在
                        const existing = currentAssets.find(a => a.fullPath === fullPath);
                        if (!existing) {
                            currentAssets.push({
                                id: id,
                                type: type,
                                filename: relativePath,
                                fullPath: fullPath,
                                mimeType: getMimeType(ext),
                                size: stat.size,
                                createdAt: stat.birthtime.toISOString(),
                                source: 'scan'
                            });
                        }
                    }
                });
            } catch(e) {
                console.log(`扫描目录失败 ${dirPath}:`, e);
            }
        });

        // 按时间排序（最新优先）
        currentAssets.sort((a, b) => {
            const timeA = a.createdAt || '';
            const timeB = b.createdAt || '';
            return timeB.localeCompare(timeA);
        });
    }

    function getMimeType(ext) {
        const mimeTypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.avi': 'video/x-msvideo',
            '.webm': 'video/webm',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    function updateManifest() {
        try {
            const manifestPath = path.join(CONFIG.assetsDir, CONFIG.manifestFile);
            const manifest = {
                version: '1.0',
                appName: 'Qiaodoumayijiang',
                lastUpdated: new Date().toISOString(),
                assetsDir: CONFIG.assetsDir,
                assets: currentAssets.map(asset => ({
                    id: asset.id,
                    type: asset.type,
                    filename: asset.filename,
                    mimeType: asset.mimeType,
                    size: asset.size,
                    prompt: asset.prompt || '',
                    modelName: asset.modelName || '',
                    createdAt: asset.createdAt
                }))
            };
            
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        } catch(e) {
            console.log('更新 manifest 失败:', e);
        }
    }

    // ==================== 渲染 ====================

    function renderAssets() {
        const filter = elements.filterSelect.value;
        const grid = elements.assetsGrid;
        
        // 清空
        grid.innerHTML = '';
        lastClickedIndex = -1;  // 重置点击索引

        // 筛选
        filteredAssets = currentAssets.filter(asset => {
            if (filter === 'all') return true;
            return asset.type === filter;
        });

        if (filteredAssets.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>暂无素材</p>
                    <p class="hint">点击「扫描文件夹」或放入文件</p>
                </div>
            `;
            return;
        }

        // 渲染卡片
        filteredAssets.forEach((asset, index) => {
            const card = createAssetCard(asset, index);
            grid.appendChild(card);
        });
    }

    /**
     * 获取图片的 base64 Data URL
     */
    function getImageDataUrl(filePath, mimeType) {
        try {
            // 限制文件大小（大于 10MB 不加载缩略图）
            const stat = fs.statSync(filePath);
            if (stat.size > 10 * 1024 * 1024) {
                return null;
            }
            
            const buffer = fs.readFileSync(filePath);
            const base64 = buffer.toString('base64');
            const mime = mimeType || 'image/png';
            return `data:${mime};base64,${base64}`;
        } catch(e) {
            console.log('读取图片失败:', e);
            return null;
        }
    }

    /**
     * 从视频中提取第一帧作为缩略图
     */
    function extractVideoThumbnail(asset, callback) {
        // 检查缓存
        if (videoThumbnailCache.has(asset.fullPath)) {
            callback(videoThumbnailCache.get(asset.fullPath));
            return;
        }

        // 检查是否有预生成的缩略图文件
        const thumbPath = asset.fullPath.replace(/\.[^.]+$/, '_thumb.jpg');
        if (fs.existsSync(thumbPath)) {
            const dataUrl = getImageDataUrl(thumbPath, 'image/jpeg');
            if (dataUrl) {
                videoThumbnailCache.set(asset.fullPath, dataUrl);
                callback(dataUrl);
                return;
            }
        }

        // 使用 HTML5 video 元素提取第一帧
        try {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.playsInline = true;
            
            const fileUrl = 'file:///' + asset.fullPath.replace(/\\/g, '/');
            
            video.onloadeddata = function() {
                video.currentTime = CONFIG.videoThumbnailTime;
            };

            video.onseeked = function() {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth || 320;
                    canvas.height = video.videoHeight || 180;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    videoThumbnailCache.set(asset.fullPath, dataUrl);
                    
                    video.src = '';
                    video.load();
                    
                    callback(dataUrl);
                } catch(e) {
                    console.log('绘制视频帧失败:', e);
                    callback(null);
                }
            };

            video.onerror = function(e) {
                console.log('加载视频失败:', e);
                callback(null);
            };

            setTimeout(() => {
                if (!videoThumbnailCache.has(asset.fullPath)) {
                    video.src = '';
                    callback(null);
                }
            }, 5000);

            video.src = fileUrl;
            video.load();
        } catch(e) {
            console.log('提取视频缩略图失败:', e);
            callback(null);
        }
    }

    function createAssetCard(asset, index) {
        const card = document.createElement('div');
        card.className = 'asset-card';
        if (selectedAssets.has(asset.id)) {
            card.classList.add('selected');
        }

        // 类型标签
        const typeLabels = { image: '图', video: '视', audio: '音' };
        
        // 名称（优先使用 prompt，去掉时间戳后缀）
        let displayName = asset.prompt || asset.id.replace(/_\d+$/, '');
        const truncatedName = displayName.length > 15 ? displayName.substring(0, 15) + '...' : displayName;

        // 大小
        const sizeStr = formatSize(asset.size);

        // 创建卡片
        card.innerHTML = `
            <div class="thumbnail-placeholder" data-type="${asset.type}">
                ${asset.type === 'image' ? '🖼️' : asset.type === 'video' ? '🎬' : '🎵'}
            </div>
            <div class="type-badge ${asset.type}">${typeLabels[asset.type] || '?'}</div>
            <div class="checkbox"></div>
            <div class="info">
                <div class="name" title="${displayName}">${truncatedName}</div>
                <div class="meta">${sizeStr}</div>
            </div>
        `;

        // 如果已导入，添加标记
        if (importedAssets.has(asset.id)) {
            const badge = document.createElement('div');
            badge.className = 'imported-badge';
            badge.textContent = '已导入';
            card.appendChild(badge);
        }

        // 异步加载缩略图
        if (asset.type === 'image' && fs.existsSync(asset.fullPath)) {
            setTimeout(() => {
                const dataUrl = getImageDataUrl(asset.fullPath, asset.mimeType);
                if (dataUrl) {
                    const placeholder = card.querySelector('.thumbnail-placeholder');
                    if (placeholder) {
                        const img = document.createElement('img');
                        img.className = 'thumbnail';
                        img.src = dataUrl;
                        img.alt = asset.id;
                        img.onerror = () => {
                            console.log('图片加载失败:', asset.fullPath);
                        };
                        placeholder.replaceWith(img);
                    }
                }
            }, 10);
        } else if (asset.type === 'video' && fs.existsSync(asset.fullPath)) {
            setTimeout(() => {
                extractVideoThumbnail(asset, (dataUrl) => {
                    if (dataUrl) {
                        const placeholder = card.querySelector('.thumbnail-placeholder');
                        if (placeholder) {
                            const img = document.createElement('img');
                            img.className = 'thumbnail';
                            img.src = dataUrl;
                            img.alt = asset.id;
                            placeholder.replaceWith(img);
                        }
                    }
                });
            }, 50);
        }

        // 点击事件 - 支持 Ctrl 和 Shift 多选
        card.addEventListener('click', (e) => {
            handleCardClick(asset, card, index, e);
        });

        // 双击导入
        card.addEventListener('dblclick', () => {
            clearSelection();
            selectedAssets.add(asset.id);
            importAssets(false);
        });

        // 存储数据
        card.dataset.assetId = asset.id;
        card.dataset.index = index;

        return card;
    }

    /**
     * 处理卡片点击 - 支持 Ctrl 和 Shift 多选
     */
    function handleCardClick(asset, card, index, e) {
        if (e.shiftKey && lastClickedIndex !== -1) {
            // Shift + 点击：范围选择
            const start = Math.min(lastClickedIndex, index);
            const end = Math.max(lastClickedIndex, index);
            
            // 如果没有按住 Ctrl，先清除之前的选择
            if (!e.ctrlKey && !e.metaKey) {
                clearSelection();
            }
            
            // 选择范围内的所有素材
            for (let i = start; i <= end; i++) {
                const assetInRange = filteredAssets[i];
                selectedAssets.add(assetInRange.id);
            }
            
            // 更新所有卡片的选中状态
            document.querySelectorAll('.asset-card').forEach(c => {
                const assetId = c.dataset.assetId;
                if (selectedAssets.has(assetId)) {
                    c.classList.add('selected');
                } else {
                    c.classList.remove('selected');
                }
            });
            
        } else if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd + 点击：切换单个选择
            toggleSelection(asset, card);
            lastClickedIndex = index;
        } else {
            // 普通点击：单选
            clearSelection();
            toggleSelection(asset, card);
            lastClickedIndex = index;
        }
        
        updateSelectionCount();
    }

    function formatSize(bytes) {
        if (!bytes) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ==================== 选择管理 ====================

    function toggleSelection(asset, card) {
        if (selectedAssets.has(asset.id)) {
            selectedAssets.delete(asset.id);
            card.classList.remove('selected');
        } else {
            selectedAssets.add(asset.id);
            card.classList.add('selected');
        }
        updateSelectionCount();
    }

    function clearSelection() {
        selectedAssets.clear();
        document.querySelectorAll('.asset-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        updateSelectionCount();
    }

    function updateSelectionCount() {
        elements.selectionCount.textContent = `已选择 ${selectedAssets.size} 个`;
    }

    // ==================== 删除功能 ====================

    function deleteSelectedAssets() {
        if (selectedAssets.size === 0) {
            alert('请先选择要删除的素材');
            return;
        }

        const count = selectedAssets.size;
        const confirmMsg = `确定要删除选中的 ${count} 个素材吗？\n\n此操作将删除文件，无法撤销！`;
        
        if (!confirm(confirmMsg)) {
            return;
        }

        let successCount = 0;
        let failCount = 0;

        currentAssets.forEach(asset => {
            if (selectedAssets.has(asset.id)) {
                try {
                    if (fs.existsSync(asset.fullPath)) {
                        fs.unlinkSync(asset.fullPath);
                        successCount++;
                        
                        // 清除视频缩略图缓存
                        videoThumbnailCache.delete(asset.fullPath);
                    }
                } catch(e) {
                    console.log('删除文件失败:', asset.fullPath, e);
                    failCount++;
                }
            }
        });

        // 清除选择
        selectedAssets.clear();
        lastClickedIndex = -1;

        // 重新扫描并渲染
        scanFolderInternal();
        updateManifest();
        renderAssets();
        updateSelectionCount();

        // 显示结果
        if (failCount > 0) {
            setStatus(`删除完成: 成功 ${successCount}, 失败 ${failCount}`);
        } else {
            setStatus(`成功删除 ${successCount} 个素材`);
        }
    }

    // ==================== 导入功能 ====================

    function importAssets(toComp) {
        if (selectedAssets.size === 0) {
            alert('请先选择要导入的素材');
            return;
        }

        const assetsToImport = currentAssets.filter(a => selectedAssets.has(a.id));
        
        setStatus('正在导入...');

        // 构建文件路径列表
        const filePaths = assetsToImport.map(a => a.fullPath.replace(/\\/g, '/'));
        
        // 调用 AE 脚本
        const script = `
            (function() {
                var filePaths = ${JSON.stringify(filePaths)};
                var toComp = ${toComp};
                var successCount = 0;
                var failCount = 0;
                
                app.beginUndoGroup("Qiaodoumayijiang 导入素材");
                
                var comp = toComp ? app.project.activeItem : null;
                if (toComp && !(comp instanceof CompItem)) {
                    return JSON.stringify({ success: false, error: "请先打开一个合成" });
                }
                
                for (var i = 0; i < filePaths.length; i++) {
                    try {
                        var file = new File(filePaths[i]);
                        if (!file.exists) {
                            failCount++;
                            continue;
                        }
                        
                        var importOptions = new ImportOptions(file);
                        var imported = app.project.importFile(importOptions);
                        
                        if (toComp && comp) {
                            comp.layers.add(imported);
                        }
                        
                        successCount++;
                    } catch(e) {
                        failCount++;
                    }
                }
                
                app.endUndoGroup();
                
                return JSON.stringify({ success: true, imported: successCount, failed: failCount });
            })();
        `;

        csInterface.evalScript(script, (result) => {
            try {
                const response = JSON.parse(result);
                if (response.success) {
                    const msg = response.failed > 0 
                        ? `导入完成: 成功 ${response.imported}, 失败 ${response.failed}`
                        : `成功导入 ${response.imported} 个素材`;
                    setStatus(msg);
                    
                    // 更新已导入状态
                    assetsToImport.forEach(asset => {
                        importedAssets.add(asset.id);
                    });
                    updateImportedBadges();
                } else {
                    alert(response.error || '导入失败');
                    setStatus('导入失败');
                }
            } catch(e) {
                setStatus('导入完成');
            }
            
            clearSelection();
        });
    }

    // ==================== 状态 ====================

    function setStatus(text) {
        elements.statusText.textContent = text;
    }

    // ==================== 启动 ====================

    document.addEventListener('DOMContentLoaded', init);

    // 页面关闭时清理
    window.addEventListener('beforeunload', () => {
        stopAutoRefresh();
    });

})();
