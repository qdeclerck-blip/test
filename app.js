// ========================================
// VoiceNotes - Voice Notes Application
// ========================================

(function () {
    'use strict';

    // ---- State ----
    let mediaRecorder = null;
    let audioChunks = [];
    let recordingStartTime = null;
    let recordingTimer = null;
    let audioContext = null;
    let analyser = null;
    let animationId = null;
    let currentlyPlayingId = null;
    let currentAudio = null;

    // Speech recognition
    let speechRecognition = null;
    let currentTranscription = '';
    let interimTranscription = '';

    // Chat
    let chatMessages = [];
    let isAiResponding = false;

    // ---- DOM Elements ----
    const btnRecord = document.getElementById('btnRecord');
    const recordingTime = document.getElementById('recordingTime');
    const recorderHint = document.getElementById('recorderHint');
    const recorderCard = document.querySelector('.recorder-card');
    const visualizer = document.getElementById('visualizer');
    const canvasCtx = visualizer.getContext('2d');
    const transcriptionLive = document.getElementById('transcriptionLive');

    const saveModal = document.getElementById('saveModal');
    const previewAudio = document.getElementById('previewAudio');
    const noteTitle = document.getElementById('noteTitle');
    const btnDiscard = document.getElementById('btnDiscard');
    const btnSave = document.getElementById('btnSave');
    const transcriptionText = document.getElementById('transcriptionText');

    const settingsModal = document.getElementById('settingsModal');
    const apiUrlInput = document.getElementById('apiUrl');
    const apiKeyInput = document.getElementById('apiKey');
    const apiModelInput = document.getElementById('apiModel');
    const btnSettingsCancel = document.getElementById('btnSettingsCancel');
    const btnSettingsSave = document.getElementById('btnSettingsSave');

    const notesList = document.getElementById('notesList');
    const emptyState = document.getElementById('emptyState');
    const notesCount = document.getElementById('notesCount');
    const searchInput = document.getElementById('searchInput');

    const btnAiToggle = document.getElementById('btnAiToggle');
    const chatPanel = document.getElementById('chatPanel');
    const chatOverlay = document.getElementById('chatOverlay');
    const chatMessagesEl = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatStatus = document.getElementById('chatStatus');
    const btnSend = document.getElementById('btnSend');
    const btnChatClose = document.getElementById('btnChatClose');
    const btnChatSettings = document.getElementById('btnChatSettings');
    const btnChatClear = document.getElementById('btnChatClear');

    // ---- Storage ----
    function getNotes() {
        try {
            return JSON.parse(localStorage.getItem('voicenotes') || '[]');
        } catch {
            return [];
        }
    }

    function saveNotes(notes) {
        localStorage.setItem('voicenotes', JSON.stringify(notes));
    }

    function addNote(note) {
        const notes = getNotes();
        notes.unshift(note);
        saveNotes(notes);
    }

    function deleteNote(id) {
        const notes = getNotes().filter(n => n.id !== id);
        saveNotes(notes);
    }

    // AI Settings
    function getAiSettings() {
        try {
            return JSON.parse(localStorage.getItem('voicenotes_ai') || '{}');
        } catch {
            return {};
        }
    }

    function saveAiSettings(settings) {
        localStorage.setItem('voicenotes_ai', JSON.stringify(settings));
    }

    // Chat history
    function getChatHistory() {
        try {
            return JSON.parse(localStorage.getItem('voicenotes_chat') || '[]');
        } catch {
            return [];
        }
    }

    function saveChatHistory(messages) {
        localStorage.setItem('voicenotes_chat', JSON.stringify(messages));
    }

    // ---- Utilities ----
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "A l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    function formatChatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ---- Speech Recognition ----
    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech Recognition API not available');
            return null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'fr-FR';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }

            if (final) {
                currentTranscription += final;
            }
            interimTranscription = interim;

            // Update live display
            const display = currentTranscription + interim;
            if (display.trim()) {
                transcriptionLive.textContent = display;
            }
        };

        recognition.onerror = (event) => {
            if (event.error !== 'aborted' && event.error !== 'no-speech') {
                console.warn('Speech recognition error:', event.error);
            }
        };

        recognition.onend = () => {
            // Restart if still recording
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                try {
                    recognition.start();
                } catch {
                    // Already started
                }
            }
        };

        return recognition;
    }

    function startSpeechRecognition() {
        currentTranscription = '';
        interimTranscription = '';
        transcriptionLive.textContent = '';

        speechRecognition = initSpeechRecognition();
        if (speechRecognition) {
            try {
                speechRecognition.start();
            } catch {
                // Already started
            }
        }
    }

    function stopSpeechRecognition() {
        if (speechRecognition) {
            try {
                speechRecognition.stop();
            } catch {
                // Already stopped
            }
            speechRecognition = null;
        }
    }

    // ---- Visualizer ----
    function drawIdleVisualizer() {
        const width = visualizer.width;
        const height = visualizer.height;
        canvasCtx.clearRect(0, 0, width, height);

        const barCount = 40;
        const barWidth = 3;
        const gap = (width - barCount * barWidth) / (barCount + 1);

        canvasCtx.fillStyle = 'rgba(108, 92, 231, 0.2)';

        for (let i = 0; i < barCount; i++) {
            const x = gap + i * (barWidth + gap);
            const barHeight = 4 + Math.sin(Date.now() / 800 + i * 0.3) * 3;
            const y = (height - barHeight) / 2;
            canvasCtx.fillRect(x, y, barWidth, barHeight);
        }

        animationId = requestAnimationFrame(drawIdleVisualizer);
    }

    function drawRecordingVisualizer() {
        if (!analyser) return;

        const width = visualizer.width;
        const height = visualizer.height;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, width, height);

        const barCount = 40;
        const barWidth = 3;
        const gap = (width - barCount * barWidth) / (barCount + 1);
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
            const dataIndex = i * step;
            const value = dataArray[dataIndex] / 255;
            const barHeight = Math.max(4, value * height * 0.8);
            const x = gap + i * (barWidth + gap);
            const y = (height - barHeight) / 2;

            const hue = 258 - value * 20;
            const lightness = 60 + value * 15;
            canvasCtx.fillStyle = `hsla(${hue}, 70%, ${lightness}%, ${0.5 + value * 0.5})`;
            canvasCtx.fillRect(x, y, barWidth, barHeight);
        }

        animationId = requestAnimationFrame(drawRecordingVisualizer);
    }

    // ---- Recording ----
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                if (audioContext) {
                    audioContext.close();
                    audioContext = null;
                }
                stopSpeechRecognition();

                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                showSaveModal(blob);
            };

            mediaRecorder.start();
            recordingStartTime = Date.now();

            // Start speech recognition
            startSpeechRecognition();

            // UI
            btnRecord.classList.add('recording');
            recorderCard.classList.add('recording');
            recorderHint.textContent = 'Enregistrement en cours...';

            recordingTimer = setInterval(() => {
                const elapsed = (Date.now() - recordingStartTime) / 1000;
                recordingTime.textContent = formatTime(elapsed);
            }, 200);

            cancelAnimationFrame(animationId);
            drawRecordingVisualizer();
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                recorderHint.textContent = "Acces au microphone refuse. Veuillez l'autoriser.";
            } else {
                recorderHint.textContent = "Erreur: impossible de demarrer l'enregistrement.";
            }
            console.error('Recording error:', err);
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        clearInterval(recordingTimer);
        btnRecord.classList.remove('recording');
        recorderCard.classList.remove('recording');
        recorderHint.textContent = 'Cliquez pour enregistrer';
        recordingTime.textContent = '00:00';

        cancelAnimationFrame(animationId);
        drawIdleVisualizer();
    }

    // ---- Save Modal ----
    let pendingBlob = null;
    let pendingDuration = 0;

    function showSaveModal(blob) {
        pendingBlob = blob;
        pendingDuration = (Date.now() - recordingStartTime) / 1000;

        const url = URL.createObjectURL(blob);
        previewAudio.src = url;
        noteTitle.value = '';

        const now = new Date();
        noteTitle.value = `Note du ${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

        // Show transcription
        const finalTranscription = currentTranscription.trim();
        if (finalTranscription) {
            transcriptionText.textContent = finalTranscription;
        } else {
            transcriptionText.textContent = 'Aucune transcription disponible (navigateur non compatible ou parole non detectee).';
        }

        transcriptionLive.textContent = '';
        saveModal.classList.add('active');
        setTimeout(() => noteTitle.select(), 100);
    }

    function hideSaveModal() {
        saveModal.classList.remove('active');
        previewAudio.pause();
        previewAudio.src = '';
        pendingBlob = null;
    }

    async function saveCurrentNote() {
        if (!pendingBlob) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const note = {
                id: generateId(),
                title: noteTitle.value.trim() || 'Note sans titre',
                audioData: reader.result,
                transcription: currentTranscription.trim() || '',
                duration: pendingDuration,
                createdAt: Date.now()
            };

            addNote(note);
            hideSaveModal();
            renderNotes();
        };
        reader.readAsDataURL(pendingBlob);
    }

    // ---- Rendering ----
    function renderNotes(filter = '') {
        let notes = getNotes();

        if (filter) {
            const q = filter.toLowerCase();
            notes = notes.filter(n =>
                n.title.toLowerCase().includes(q) ||
                (n.transcription && n.transcription.toLowerCase().includes(q))
            );
        }

        notesList.innerHTML = '';
        const count = notes.length;

        notesCount.textContent = `${count} note${count !== 1 ? 's' : ''}`;

        if (count === 0) {
            emptyState.classList.add('visible');
            if (filter) {
                emptyState.querySelector('p').textContent = 'Aucun resultat';
                emptyState.querySelector('span').textContent = 'Essayez un autre terme de recherche.';
            } else {
                emptyState.querySelector('p').textContent = 'Aucune note vocale';
                emptyState.querySelector('span').textContent = 'Enregistrez votre premiere note !';
            }
            return;
        }

        emptyState.classList.remove('visible');

        notes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.dataset.id = note.id;

            const transcriptionHtml = note.transcription
                ? `<div class="note-transcription collapsed" data-id="${note.id}">
                       <div class="note-transcription-label">Transcription</div>
                       ${escapeHtml(note.transcription)}
                   </div>`
                : '';

            card.innerHTML = `
                <div class="note-card-header">
                    <div class="note-info">
                        <div class="note-title">${escapeHtml(note.title)}</div>
                        <div class="note-meta">
                            <span class="note-meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                ${formatDate(note.createdAt)}
                            </span>
                            <span class="note-meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                </svg>
                                ${formatTime(note.duration)}
                            </span>
                        </div>
                    </div>
                    <div class="note-actions">
                        <button class="btn-icon btn-download" title="Telecharger">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </button>
                        <button class="btn-icon danger btn-delete" title="Supprimer">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/>
                                <path d="M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                ${transcriptionHtml}
                <div class="note-player">
                    <div class="custom-player">
                        <button class="btn-play" data-id="${note.id}">
                            <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display:none">
                                <rect x="6" y="4" width="4" height="16"/>
                                <rect x="14" y="4" width="4" height="16"/>
                            </svg>
                        </button>
                        <div class="player-progress">
                            <div class="progress-bar" data-id="${note.id}">
                                <div class="progress-fill"></div>
                            </div>
                            <span class="player-time">00:00 / ${formatTime(note.duration)}</span>
                        </div>
                    </div>
                </div>
            `;

            notesList.appendChild(card);
        });

        attachNoteEvents();
    }

    function attachNoteEvents() {
        document.querySelectorAll('.btn-play').forEach(btn => {
            btn.addEventListener('click', () => handlePlay(btn.dataset.id));
        });

        document.querySelectorAll('.progress-bar').forEach(bar => {
            bar.addEventListener('click', (e) => handleSeek(bar.dataset.id, e));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.note-card');
                const id = card.dataset.id;
                if (currentlyPlayingId === id) {
                    stopPlayback();
                }
                card.style.opacity = '0';
                card.style.transform = 'translateY(-8px)';
                card.style.transition = 'all 0.2s ease';
                setTimeout(() => {
                    deleteNote(id);
                    renderNotes(searchInput.value);
                }, 200);
            });
        });

        document.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.note-card');
                const id = card.dataset.id;
                const notes = getNotes();
                const note = notes.find(n => n.id === id);
                if (!note) return;

                const a = document.createElement('a');
                a.href = note.audioData;
                a.download = `${note.title}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
        });

        // Toggle transcription collapse
        document.querySelectorAll('.note-transcription').forEach(el => {
            el.addEventListener('click', () => {
                el.classList.toggle('collapsed');
            });
        });
    }

    // ---- Playback ----
    function handlePlay(noteId) {
        if (currentlyPlayingId === noteId) {
            if (currentAudio.paused) {
                currentAudio.play();
                updatePlayButton(noteId, true);
            } else {
                currentAudio.pause();
                updatePlayButton(noteId, false);
            }
            return;
        }

        stopPlayback();

        const notes = getNotes();
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        currentAudio = new Audio(note.audioData);
        currentlyPlayingId = noteId;

        currentAudio.addEventListener('timeupdate', () => {
            updateProgress(noteId, currentAudio.currentTime, currentAudio.duration);
        });

        currentAudio.addEventListener('ended', () => {
            stopPlayback();
            updatePlayButton(noteId, false);
            updateProgress(noteId, 0, note.duration);
        });

        currentAudio.play();
        updatePlayButton(noteId, true);
    }

    function stopPlayback() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.src = '';
            currentAudio = null;
        }
        if (currentlyPlayingId) {
            updatePlayButton(currentlyPlayingId, false);
            currentlyPlayingId = null;
        }
    }

    function updatePlayButton(noteId, isPlaying) {
        const btn = document.querySelector(`.btn-play[data-id="${noteId}"]`);
        if (!btn) return;
        const playIcon = btn.querySelector('.play-icon');
        const pauseIcon = btn.querySelector('.pause-icon');
        if (isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }

    function updateProgress(noteId, currentTime, duration) {
        const bar = document.querySelector(`.progress-bar[data-id="${noteId}"]`);
        if (!bar) return;
        const fill = bar.querySelector('.progress-fill');
        const timeLabel = bar.parentElement.querySelector('.player-time');
        const progress = duration ? (currentTime / duration) * 100 : 0;
        fill.style.width = `${progress}%`;
        timeLabel.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }

    function handleSeek(noteId, event) {
        if (currentlyPlayingId !== noteId || !currentAudio) return;
        const bar = event.currentTarget;
        const rect = bar.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        currentAudio.currentTime = percent * currentAudio.duration;
    }

    // ---- AI Chat ----
    function openChat() {
        chatPanel.classList.add('open');
        chatOverlay.classList.add('active');
        chatInput.focus();
    }

    function closeChat() {
        chatPanel.classList.remove('open');
        chatOverlay.classList.remove('active');
    }

    function openSettings() {
        const settings = getAiSettings();
        apiUrlInput.value = settings.apiUrl || '';
        apiKeyInput.value = settings.apiKey || '';
        apiModelInput.value = settings.model || '';
        settingsModal.classList.add('active');
    }

    function closeSettings() {
        settingsModal.classList.remove('active');
    }

    function saveSettings() {
        const settings = {
            apiUrl: apiUrlInput.value.trim(),
            apiKey: apiKeyInput.value.trim(),
            model: apiModelInput.value.trim()
        };
        saveAiSettings(settings);
        closeSettings();
        setChatStatus('Configuration sauvegardee.', 'success');
        setTimeout(() => setChatStatus(''), 2000);
    }

    function setChatStatus(message, type = '') {
        chatStatus.textContent = message;
        chatStatus.className = 'chat-status' + (type ? ' ' + type : '');
    }

    function buildNotesContext() {
        const notes = getNotes();
        if (notes.length === 0) {
            return "L'utilisateur n'a aucune note vocale enregistree.";
        }

        let context = `L'utilisateur a ${notes.length} note(s) vocale(s) :\n\n`;
        notes.forEach((note, i) => {
            const date = new Date(note.createdAt).toLocaleString('fr-FR');
            const duration = formatTime(note.duration);
            context += `--- Note ${i + 1} ---\n`;
            context += `Titre: ${note.title}\n`;
            context += `Date: ${date}\n`;
            context += `Duree: ${duration}\n`;
            if (note.transcription) {
                context += `Transcription: ${note.transcription}\n`;
            } else {
                context += `Transcription: (non disponible)\n`;
            }
            context += '\n';
        });

        return context;
    }

    function renderChatMessages() {
        const messages = getChatHistory();
        chatMessagesEl.innerHTML = '';

        if (messages.length === 0) {
            chatMessagesEl.innerHTML = `
                <div class="chat-welcome">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27a7 7 0 0 1-12.46 0H6a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                        <circle cx="9" cy="13" r="1.25" fill="currentColor" stroke="none"/>
                        <circle cx="15" cy="13" r="1.25" fill="currentColor" stroke="none"/>
                        <path d="M10 17a2 2 0 0 0 4 0"/>
                    </svg>
                    <p>Posez-moi des questions sur vos notes vocales !</p>
                    <span>Je peux analyser, resumer et retrouver des informations dans toutes vos notes.</span>
                </div>`;
            return;
        }

        messages.forEach(msg => {
            const msgEl = document.createElement('div');
            msgEl.className = `chat-msg ${msg.role}`;
            msgEl.innerHTML = `
                <div class="chat-msg-bubble">${escapeHtml(msg.content)}</div>
                <div class="chat-msg-time">${formatChatTime(msg.timestamp)}</div>
            `;
            chatMessagesEl.appendChild(msgEl);
        });

        scrollChatToBottom();
    }

    function addChatMessage(role, content) {
        const messages = getChatHistory();
        messages.push({ role, content, timestamp: Date.now() });
        saveChatHistory(messages);
        renderChatMessages();
    }

    function showTypingIndicator() {
        const el = document.createElement('div');
        el.className = 'typing-indicator';
        el.id = 'typingIndicator';
        el.innerHTML = '<span></span><span></span><span></span>';
        chatMessagesEl.appendChild(el);
        scrollChatToBottom();
    }

    function removeTypingIndicator() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    function scrollChatToBottom() {
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    }

    async function sendChatMessage() {
        const message = chatInput.value.trim();
        if (!message || isAiResponding) return;

        const settings = getAiSettings();
        if (!settings.apiUrl || !settings.apiKey) {
            setChatStatus('Configurez l\'API dans les parametres (icone engrenage).', 'error');
            return;
        }

        // Add user message
        addChatMessage('user', message);
        chatInput.value = '';

        isAiResponding = true;
        btnSend.disabled = true;
        setChatStatus('');
        showTypingIndicator();

        try {
            const notesContext = buildNotesContext();
            const history = getChatHistory();

            // Build messages for API
            const apiMessages = [
                {
                    role: 'system',
                    content: `Tu es un assistant IA integre dans une application de notes vocales appelée VoiceNotes. Tu as acces aux transcriptions de toutes les notes vocales de l'utilisateur. Tu dois repondre en francais. Tu peux analyser, resumer, comparer et retrouver des informations dans les notes. Si l'utilisateur te pose une question sur le contenu de ses notes, base ta reponse uniquement sur les transcriptions disponibles. Si une note n'a pas de transcription, mentionne-le. Sois concis et utile.\n\nVoici les notes vocales de l'utilisateur :\n\n${notesContext}`
                }
            ];

            // Add conversation history (last 20 messages max)
            const recentHistory = history.slice(-20);
            recentHistory.forEach(msg => {
                apiMessages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });

            const response = await fetch(settings.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.apiKey}`
                },
                body: JSON.stringify({
                    model: settings.model || 'gpt-4o-mini',
                    messages: apiMessages,
                    max_tokens: 1024,
                    temperature: 0.7
                })
            });

            removeTypingIndicator();

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API error ${response.status}: ${errorData.substring(0, 200)}`);
            }

            const data = await response.json();
            const assistantMessage = data.choices?.[0]?.message?.content;

            if (assistantMessage) {
                addChatMessage('assistant', assistantMessage);
            } else {
                throw new Error('Reponse vide de l\'API.');
            }
        } catch (err) {
            removeTypingIndicator();
            console.error('AI Chat error:', err);
            setChatStatus(`Erreur: ${err.message}`, 'error');
        } finally {
            isAiResponding = false;
            btnSend.disabled = false;
        }
    }

    function clearChat() {
        saveChatHistory([]);
        renderChatMessages();
        setChatStatus('');
    }

    // ---- Events ----

    // Recording
    btnRecord.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            stopRecording();
        } else {
            startRecording();
        }
    });

    // Save modal
    btnSave.addEventListener('click', saveCurrentNote);
    btnDiscard.addEventListener('click', hideSaveModal);
    saveModal.addEventListener('click', (e) => {
        if (e.target === saveModal) hideSaveModal();
    });
    noteTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveCurrentNote();
    });

    // Search
    searchInput.addEventListener('input', () => {
        renderNotes(searchInput.value);
    });

    // Chat panel
    btnAiToggle.addEventListener('click', openChat);
    btnChatClose.addEventListener('click', closeChat);
    chatOverlay.addEventListener('click', closeChat);

    // Chat input
    btnSend.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    // Chat settings
    btnChatSettings.addEventListener('click', openSettings);
    btnSettingsCancel.addEventListener('click', closeSettings);
    btnSettingsSave.addEventListener('click', saveSettings);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettings();
    });

    // Clear chat
    btnChatClear.addEventListener('click', clearChat);

    // Keyboard shortcut: space to record
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (saveModal.classList.contains('active')) return;
        if (settingsModal.classList.contains('active')) return;
        if (chatPanel.classList.contains('open')) return;

        if (e.code === 'Space') {
            e.preventDefault();
            btnRecord.click();
        }
    });

    // Canvas resize
    function resizeCanvas() {
        const container = visualizer.parentElement;
        visualizer.width = container.clientWidth;
        visualizer.height = 80;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ---- Init ----
    renderNotes();
    renderChatMessages();
    drawIdleVisualizer();
})();
