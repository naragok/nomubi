const GITHUB_SYNC_SETTINGS_KEY = 'labor_payment_github_sync_settings_v1';

function getGithubSyncSettings() {
    try {
        const saved = localStorage.getItem(GITHUB_SYNC_SETTINGS_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
}

function setGithubSyncStatus(message) {
    const el = document.getElementById('githubSyncStatus');
    if (el) el.textContent = message || '';
}

function openGithubSyncModal() {
    const settings = getGithubSyncSettings();
    document.getElementById('githubOwner').value = settings.owner || '';
    document.getElementById('githubRepo').value = settings.repo || '';
    document.getElementById('githubBranch').value = settings.branch || 'main';
    document.getElementById('githubPath').value = settings.path || 'data/labor-payment-data.json';
    document.getElementById('githubToken').value = settings.token || '';
    document.getElementById('githubRememberToken').checked = Boolean(settings.token);
    setGithubSyncStatus('');
    document.getElementById('githubSyncModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeGithubSyncModal() {
    document.getElementById('githubSyncModal').classList.add('hidden');
}

function readGithubSyncForm() {
    const owner = document.getElementById('githubOwner').value.trim();
    const repo = document.getElementById('githubRepo').value.trim();
    const branch = document.getElementById('githubBranch').value.trim() || 'main';
    const path = document.getElementById('githubPath').value.trim() || 'data/labor-payment-data.json';
    const token = document.getElementById('githubToken').value.trim();
    const rememberToken = document.getElementById('githubRememberToken').checked;

    if (!owner || !repo || !branch || !path) {
        throw new Error('Owner, Repository, Branch, Data Path를 모두 입력하세요.');
    }
    if (!token) {
        throw new Error('GitHub Personal Access Token을 입력하세요.');
    }

    return { owner, repo, branch, path, token, rememberToken };
}

function saveGithubSyncSettings() {
    try {
        const settings = readGithubSyncForm();
        const settingsToSave = {
            owner: settings.owner,
            repo: settings.repo,
            branch: settings.branch,
            path: settings.path
        };
        if (settings.rememberToken) settingsToSave.token = settings.token;
        localStorage.setItem(GITHUB_SYNC_SETTINGS_KEY, JSON.stringify(settingsToSave));
        showToast('GitHub 설정을 저장했습니다.');
        setGithubSyncStatus('설정 저장 완료');
    } catch (err) {
        showCustomAlert(err.message || 'GitHub 설정 저장에 실패했습니다.');
    }
}

function githubApiUrl(settings) {
    const encodedPath = settings.path.split('/').map(encodeURIComponent).join('/');
    return `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}/contents/${encodedPath}`;
}

function encodeBase64Utf8(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
}

function decodeBase64Utf8(base64) {
    const binary = atob(base64.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

async function githubFetch(settings, url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${settings.token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        let detail = '';
        try {
            const err = await response.json();
            detail = err.message ? `: ${err.message}` : '';
        } catch (e) {}
        throw new Error(`GitHub API 오류 (${response.status})${detail}`);
    }
    return response;
}

async function getGithubFileInfo(settings) {
    const url = `${githubApiUrl(settings)}?ref=${encodeURIComponent(settings.branch)}`;
    try {
        const response = await githubFetch(settings, url);
        return await response.json();
    } catch (err) {
        if (err.message.includes('(404)')) return null;
        throw err;
    }
}

async function saveToGithub() {
    let settings;
    try {
        settings = readGithubSyncForm();
        saveGithubSyncSettings();
        setGithubSyncStatus('GitHub 저장 중...');

        const existing = await getGithubFileInfo(settings);
        const body = {
            message: `Update labor payment data ${new Date().toISOString()}`,
            content: encodeBase64Utf8(JSON.stringify(appState, null, 2)),
            branch: settings.branch
        };
        if (existing && existing.sha) body.sha = existing.sha;

        await githubFetch(settings, githubApiUrl(settings), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        setGithubSyncStatus('GitHub 저장 완료');
        showToast('GitHub에 데이터를 저장했습니다.');
    } catch (err) {
        setGithubSyncStatus('저장 실패');
        showCustomAlert(err.message || 'GitHub 저장에 실패했습니다.');
    }
}

async function loadFromGithub() {
    let settings;
    try {
        settings = readGithubSyncForm();
        saveGithubSyncSettings();
        setGithubSyncStatus('GitHub에서 불러오는 중...');

        const fileInfo = await getGithubFileInfo(settings);
        if (!fileInfo || !fileInfo.content) {
            throw new Error('GitHub에 저장된 데이터 파일을 찾을 수 없습니다.');
        }

        const parsed = JSON.parse(decodeBase64Utf8(fileInfo.content));
        if (!parsed || typeof parsed !== 'object') throw new Error('데이터 형식이 올바르지 않습니다.');
        if (typeof parsed.projects !== 'object' || parsed.projects === null) throw new Error('projects 필드가 없습니다.');
        if (typeof parsed.currentProjectId !== 'string') throw new Error('currentProjectId 필드가 없습니다.');

        showCustomConfirm(
            'GitHub 데이터를 불러오면 현재 브라우저의 데이터가 교체됩니다. 계속할까요?',
            () => {
                appState = parsed;
                saveToLocalStorage();
                populateDropdowns();
                onProjectChange();
                closeGithubSyncModal();
                showToast('GitHub 데이터를 불러왔습니다.');
            }
        );
        setGithubSyncStatus('불러오기 완료');
    } catch (err) {
        setGithubSyncStatus('불러오기 실패');
        showCustomAlert(err.message || 'GitHub 불러오기에 실패했습니다.');
    }
}
