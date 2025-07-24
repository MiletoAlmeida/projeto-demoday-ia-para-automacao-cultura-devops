document.addEventListener('DOMContentLoaded', () => {
    // --- REFERÊNCIAS AOS ELEMENTOS DO DOM ---
    const scoreDisplay = document.getElementById('score-display');
    const selectionScreen = document.getElementById('selection-screen');
    const quizWrapper = document.getElementById('quiz-wrapper');
    const resultsScreen = document.getElementById('results-screen');
    const quizThemeTitle = document.getElementById('quiz-theme-title');
    const progressBar = document.getElementById('progress-bar');
    const questionCounter = document.getElementById('question-counter');
    const timerDisplay = document.getElementById('timer');
    const questionText = document.getElementById('question-text');
    const questionHint = document.getElementById('question-hint');
    const optionsContainer = document.getElementById('options-container');
    const submitBtn = document.getElementById('submit-btn');
    const feedbackContainer = document.getElementById('feedback-container');
    const finalScore = document.getElementById('final-score');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const restartBtn = document.getElementById('restart-btn');

    // --- ESTADO DO QUIZ ---
    let allQuizzes = {};
    let currentQuiz = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timerInterval;
    let timeLeft = 30; // 30 segundos por pergunta

    const themeTitles = {
        iac: 'Infraestrutura como Código (IaC)',
        microservicos: 'Arquitetura de Microsserviços',
        pipelines: 'Adoção de Pipelines (CI/CD)',
        kubernetes: 'Escalabilidade com Kubernetes'
    };

    // --- INICIALIZAÇÃO ---
    fetch('data/quiz.json')
        .then(response => response.json())
        .then(data => {
            allQuizzes = data;
            setupThemeButtons();
        })
        .catch(error => {
            console.error("Erro ao carregar o quiz.json:", error);
            selectionScreen.innerHTML = "<h1>Erro ao carregar o quiz. Verifique o console.</h1>";
        });

    function setupThemeButtons() {
        document.querySelectorAll('.theme-btn').forEach(button => {
            button.addEventListener('click', () => {
                const theme = button.getAttribute('data-theme');
                startQuiz(theme);
            });
        });
    }

    function startQuiz(theme) {
        selectionScreen.classList.add('hidden');
        resultsScreen.classList.add('hidden');
        quizWrapper.classList.remove('hidden');
        quizWrapper.classList.add('fade-in');

        currentQuiz = allQuizzes[theme];
        quizThemeTitle.textContent = themeTitles[theme];
        currentQuestionIndex = 0;
        score = 0;
        updateScoreDisplay();
        
        showQuestion();
    }

    // --- LÓGICA DO QUIZ ---
    function showQuestion() {
        resetQuestionState();
        const question = currentQuiz[currentQuestionIndex];
        
        // Atualiza UI
        progressBar.style.width = `${((currentQuestionIndex) / currentQuiz.length) * 100}%`;
        questionCounter.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuiz.length}`;
        questionText.textContent = question.pergunta;
        questionHint.textContent = question.respostas.length > 1 
            ? `(Marque ${question.respostas.length} opções)` 
            : '(Marque 1 opção)';

        // Renderiza opções
        optionsContainer.innerHTML = '';
        question.opcoes.forEach(optionText => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.innerHTML = `
                <input type="checkbox" value="${optionText}" id="${optionText.replace(/\s+/g, '-')}">
                <label for="${optionText.replace(/\s+/g, '-')}">${optionText}</label>
            `;
            optionsContainer.appendChild(optionElement);
        });
        
        startTimer();
    }
    
    function checkAnswer() {
        clearInterval(timerInterval); // Para o timer
        submitBtn.disabled = true;

        const selectedCheckboxes = optionsContainer.querySelectorAll('input[type="checkbox"]:checked');
        const userAnswers = Array.from(selectedCheckboxes).map(cb => cb.value);
        const correctAnswers = currentQuiz[currentQuestionIndex].respostas;
        
        const isCorrect = userAnswers.length === correctAnswers.length && 
                          userAnswers.sort().join(',') === correctAnswers.sort().join(',');

        // Feedback visual
        optionsContainer.querySelectorAll('.option').forEach(opt => {
            const input = opt.querySelector('input');
            if (correctAnswers.includes(input.value)) {
                opt.classList.add('correct');
            } else if (userAnswers.includes(input.value)) {
                opt.classList.add('incorrect');
            }
        });

        if (isCorrect) {
            score++;
            updateScoreDisplay();
            feedbackContainer.textContent = 'Correto! ✔️';
            feedbackContainer.className = 'correct';
        } else {
            feedbackContainer.textContent = 'Incorreto. ❌';
            feedbackContainer.className = 'incorrect';
        }
        
        // Move para a próxima questão ou finaliza
        setTimeout(() => {
            currentQuestionIndex++;
            progressBar.style.width = `${((currentQuestionIndex) / currentQuiz.length) * 100}%`;
            if (currentQuestionIndex < currentQuiz.length) {
                showQuestion();
            } else {
                endQuiz();
            }
        }, 2500);
    }
    
    function endQuiz() {
        quizWrapper.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        resultsScreen.classList.add('fade-in');

        finalScore.textContent = `${score}/${currentQuiz.length}`;
        const percentage = (score / currentQuiz.length) * 100;
        
        if (percentage === 100) {
            resultTitle.textContent = 'Excelente! 🚀';
            resultMessage.textContent = 'Você dominou o assunto. Parabéns!';
        } else if (percentage >= 70) {
            resultTitle.textContent = 'Muito Bom! 👍';
            resultMessage.textContent = 'Seu conhecimento está afiado!';
        } else {
            resultTitle.textContent = 'Continue Estudando! 🧠';
            resultMessage.textContent = 'Você está no caminho certo para se tornar um expert.';
        }
    }

    // --- FUNÇÕES AUXILIARES ---
    function resetQuestionState() {
        feedbackContainer.textContent = '';
        optionsContainer.innerHTML = '';
        submitBtn.disabled = false;
        clearInterval(timerInterval);
    }

    function updateScoreDisplay() {
        scoreDisplay.textContent = `Pontos: ${score}`;
    }

    function startTimer() {
        timeLeft = 30;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                checkAnswer(); // Acabou o tempo, verifica a resposta
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        timerDisplay.textContent = `00:${timeLeft.toString().padStart(2, '0')}`;
        timerDisplay.classList.toggle('warning', timeLeft <= 10);
    }

    // --- EVENT LISTENERS ---
    submitBtn.addEventListener('click', checkAnswer);
    restartBtn.addEventListener('click', () => {
        window.location.reload(); // A forma mais simples de reiniciar tudo
    });
});