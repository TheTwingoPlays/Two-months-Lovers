const DEFAULT_QUESTIONS = [
  { text: "Когда мы, кажется, начали общаться?", options: ["25 августа", "12 сентября", "25 октября"], correct: 0 },
  { text: "А какого числа мы начали встречаться?", options: ["12 сентября", "25 августа", "12 октября"], correct: 0 },
  { text: "Что было с нами на фотографиях у скамейки?", options: ["Большой букет цветов", "Воздушные шарики", "Коробка с подарком"], correct: 0 },
  { text: "Что видно вокруг нас на снимках с заката?", options: ["Воду и набережную с перилами", "Снежный лес", "Городскую площадь"], correct: 0 },
  { text: "Что мы делали на одном из кадров у воды?", options: ["Я поднял тебя на руки", "Мы катались на велосипедах", "Мы запускали воздушного змея"], correct: 0 },
];

function isValidQuestionSet(saved) {
  return Array.isArray(saved) && saved.length === 5 && saved.every(question =>
    typeof question.text === "string" && question.text.trim() &&
    Array.isArray(question.options) && question.options.length === 3 &&
    question.options.every(option => typeof option === "string" && option.trim()) &&
    Number.isInteger(question.correct) && question.correct >= 0 && question.correct < 3);
}

function loadQuestions() {
  try {
    const sharedQuestions = new URL(window.location.href).searchParams.get("quiz");
    if (sharedQuestions) {
      const shared = JSON.parse(sharedQuestions);
      if (isValidQuestionSet(shared)) return shared;
    }
  } catch { /* Ignore an incomplete or malformed shared link. */ }
  try {
    const saved = JSON.parse(localStorage.getItem("twoMonthQuizQuestions") || "null");
    if (isValidQuestionSet(saved)) return saved;
  } catch { /* Use the editable starter questions when local storage is empty or unavailable. */ }
  return DEFAULT_QUESTIONS.map(question => ({ ...question, options: [...question.options] }));
}

let questions = loadQuestions();
let questionIndex = 0;
let selectedOption = null;
let answered = false;
let scoreRecords = [];

const quizPlay = document.querySelector("#quiz-play");
const quizResult = document.querySelector("#quiz-result");
const quizQuestion = document.querySelector("#quiz-question");
const quizCounter = document.querySelector("#quiz-counter");
const quizOptions = document.querySelector("#quiz-options");
const quizFeedback = document.querySelector("#quiz-feedback");
const progressFill = document.querySelector("#quiz-progress-fill");
const checkAnswerButton = document.querySelector("#check-answer");
const nextQuestionButton = document.querySelector("#quiz-next");
const editorList = document.querySelector("#editor-list");
const editorStatus = document.querySelector("#editor-status");

function renderQuestion() {
  const question = questions[questionIndex];
  selectedOption = null;
  answered = false;
  quizCounter.textContent = `ВОПРОС ${questionIndex + 1} / ${questions.length}`;
  progressFill.style.width = `${(questionIndex / questions.length) * 100}%`;
  quizQuestion.textContent = question.text;
  quizFeedback.textContent = "";
  quizFeedback.className = "quiz-feedback";
  quizOptions.replaceChildren();
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.setAttribute("aria-pressed", "false");
    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.textContent = String.fromCharCode(65 + index);
    const label = document.createElement("span");
    label.textContent = option;
    button.append(letter, label);
    button.addEventListener("click", () => {
      if (answered) return;
      selectedOption = index;
      quizOptions.querySelectorAll(".quiz-option").forEach((item, itemIndex) => {
        item.classList.toggle("is-selected", itemIndex === index);
        item.setAttribute("aria-pressed", String(itemIndex === index));
      });
      quizFeedback.textContent = "";
      quizFeedback.className = "quiz-feedback";
    });
    quizOptions.append(button);
  });
  checkAnswerButton.hidden = false;
  nextQuestionButton.hidden = true;
  nextQuestionButton.textContent = questionIndex === questions.length - 1 ? "Итог теста →" : "Дальше →";
}

checkAnswerButton.addEventListener("click", () => {
  if (selectedOption === null) {
    quizFeedback.textContent = "Сначала выбери вариант ответа.";
    quizFeedback.className = "quiz-feedback is-reminder";
    return;
  }
  const question = questions[questionIndex];
  const isCorrect = selectedOption === question.correct;
  answered = true;
  scoreRecords[questionIndex] = { question: question.text, chosen: question.options[selectedOption], correct: question.options[question.correct], isCorrect };
  quizOptions.querySelectorAll(".quiz-option").forEach((button, index) => {
    button.disabled = true;
    if (index === question.correct) button.classList.add("is-correct");
    else if (index === selectedOption) button.classList.add("is-incorrect");
  });
  quizFeedback.textContent = isCorrect ? "Да, всё именно так ♡" : `Почти! Правильный ответ: ${question.options[question.correct]}.`;
  quizFeedback.className = `quiz-feedback ${isCorrect ? "is-correct" : "is-incorrect"}`;
  checkAnswerButton.hidden = true;
  nextQuestionButton.hidden = false;
  progressFill.style.width = `${((questionIndex + 1) / questions.length) * 100}%`;
});

nextQuestionButton.addEventListener("click", () => {
  if (!answered) return;
  if (questionIndex < questions.length - 1) {
    questionIndex += 1;
    renderQuestion();
  } else {
    showQuizResult();
  }
});

function showQuizResult() {
  const score = scoreRecords.filter(record => record?.isCorrect).length;
  quizPlay.hidden = true;
  quizResult.hidden = false;
  progressFill.style.width = "100%";
  document.querySelector("#quiz-score-title").textContent = `${score} из ${questions.length} — ${score === 5 ? "ты помнишь всё ♡" : "а наша история продолжается ♡"}`;
  document.querySelector("#quiz-score-copy").textContent = score === 5
    ? "Пять из пяти! Похоже, эти моменты дороги нам обоим."
    : "Главное мы помним — и впереди ещё много наших моментов.";
  const resultSummary = [
    `Результат мини-теста: ${score} из ${questions.length}.`,
    ...scoreRecords.map((record, index) => `${index + 1}. ${record.question}\nОтвет: ${record.chosen}\nПравильный ответ: ${record.correct}\n${record.isCorrect ? "Верно" : "Неверно"}`),
  ].join("\n\n");
  document.querySelector("#quiz-summary").value = resultSummary;
  document.querySelector("#quiz-email-summary").value = resultSummary;
  document.querySelector("#telegram-copy-status").textContent = "Скопируй результат и просто скинь его мне в Telegram :))";
  document.querySelector("#quiz-send-status").textContent = "Отправка необязательна; результат увидит только Дима.";
  document.querySelector("#quiz-consent").checked = false;
  document.querySelector("#send-quiz-result").disabled = false;
  document.querySelector("#send-quiz-result").innerHTML = 'Отправить результат Диме <span aria-hidden="true">↗</span>';
}

document.querySelector("#quiz-restart").addEventListener("click", () => {
  questionIndex = 0;
  scoreRecords = [];
  quizResult.hidden = true;
  quizPlay.hidden = false;
  renderQuestion();
});

document.querySelector("#copy-quiz-telegram").addEventListener("click", async () => {
  const resultText = document.querySelector("#quiz-summary");
  const status = document.querySelector("#telegram-copy-status");
  try {
    await navigator.clipboard.writeText(resultText.value);
    status.textContent = "Скопировано! Теперь просто отправь мне это в Telegram :)) ♡";
  } catch {
    resultText.focus();
    resultText.select();
    status.textContent = "Текст выделен — скопируй его и отправь мне в Telegram :)) ♡";
  }
});

function renderEditor() {
  editorList.replaceChildren();
  questions.forEach((question, questionNumber) => {
    const card = document.createElement("fieldset");
    card.className = "editor-question";
    const legend = document.createElement("legend");
    legend.textContent = `Вопрос ${questionNumber + 1}`;
    card.append(legend);

    const questionLabel = document.createElement("label");
    questionLabel.className = "editor-field editor-prompt";
    questionLabel.append(document.createTextNode("Текст вопроса"));
    const promptInput = document.createElement("textarea");
    promptInput.rows = 2;
    promptInput.maxLength = 180;
    promptInput.value = question.text;
    promptInput.dataset.questionText = "true";
    questionLabel.append(promptInput);
    card.append(questionLabel);

    question.options.forEach((option, optionIndex) => {
      const optionLabel = document.createElement("label");
      optionLabel.className = "editor-field editor-option-field";
      optionLabel.append(document.createTextNode(`Вариант ${String.fromCharCode(65 + optionIndex)}`));
      const optionInput = document.createElement("input");
      optionInput.type = "text";
      optionInput.maxLength = 120;
      optionInput.value = option;
      optionInput.dataset.optionIndex = String(optionIndex);
      optionInput.addEventListener("input", () => {
        const choice = correctSelect.options[optionIndex];
        choice.textContent = `${String.fromCharCode(65 + optionIndex)} · ${optionInput.value || "(пусто)"}`;
      });
      optionLabel.append(optionInput);
      card.append(optionLabel);
    });

    const correctLabel = document.createElement("label");
    correctLabel.className = "editor-field editor-correct-field";
    correctLabel.append(document.createTextNode("Правильный вариант"));
    const correctSelect = document.createElement("select");
    correctSelect.dataset.correctOption = "true";
    question.options.forEach((option, index) => {
      const choice = document.createElement("option");
      choice.value = String(index);
      choice.textContent = `${String.fromCharCode(65 + index)} · ${option}`;
      choice.selected = index === question.correct;
      correctSelect.append(choice);
    });
    correctLabel.append(correctSelect);
    card.append(correctLabel);
    editorList.append(card);
  });
}

document.querySelector("#save-quiz").addEventListener("click", () => {
  const edited = [...editorList.querySelectorAll(".editor-question")].map(card => ({
    text: card.querySelector("[data-question-text]").value.trim(),
    options: [...card.querySelectorAll("[data-option-index]")].map(input => input.value.trim()),
    correct: Number(card.querySelector("[data-correct-option]").value),
  }));
  if (edited.some(question => !question.text || question.options.some(option => !option))) {
    editorStatus.textContent = "Заполни текст вопроса и все три варианта.";
    return;
  }
  questions = edited;
  let storedLocally = true;
  try { localStorage.setItem("twoMonthQuizQuestions", JSON.stringify(questions)); }
  catch { storedLocally = false; }
  try {
    const updatedUrl = new URL(window.location.href);
    updatedUrl.searchParams.set("quiz", JSON.stringify(questions));
    window.history.replaceState(null, "", updatedUrl);
  } catch { /* The generated share link still works even if this browser blocks URL updates. */ }
  editorStatus.textContent = storedLocally
    ? "Тест сохранён здесь и в ссылке. Скопируй ссылку, чтобы поделиться правками."
    : "Тест готов. Скопируй ссылку — настройки будут в ней.";
  questionIndex = 0;
  scoreRecords = [];
  quizPlay.hidden = false;
  quizResult.hidden = true;
  renderQuestion();
});

document.querySelector("#share-quiz").addEventListener("click", async () => {
  const shareUrl = new URL(window.location.href);
  shareUrl.searchParams.set("quiz", JSON.stringify(questions));
  const linkField = document.querySelector("#quiz-share-url");
  linkField.value = shareUrl.href;
  document.querySelector("#share-link-wrap").hidden = false;
  try {
    await navigator.clipboard.writeText(shareUrl.href);
    editorStatus.textContent = "Ссылка скопирована — отправь её ей вместе с сайтом.";
  } catch {
    linkField.focus();
    linkField.select();
    editorStatus.textContent = "Ссылка выделена: скопируй её и отправь ей вместе с сайтом.";
  }
});

document.querySelector("#reset-quiz").addEventListener("click", () => {
  questions = DEFAULT_QUESTIONS.map(question => ({ ...question, options: [...question.options] }));
  try { localStorage.removeItem("twoMonthQuizQuestions"); } catch { /* Reset still applies for this page. */ }
  const resetUrl = new URL(window.location.href);
  resetUrl.searchParams.delete("quiz");
  window.history.replaceState(null, "", resetUrl);
  renderEditor();
  questionIndex = 0;
  scoreRecords = [];
  quizPlay.hidden = false;
  quizResult.hidden = true;
  renderQuestion();
  document.querySelector("#share-link-wrap").hidden = true;
  editorStatus.textContent = "Начальные вопросы восстановлены.";
});

const quizEmailForm = document.querySelector("#quiz-email-form");
quizEmailForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!quizEmailForm.reportValidity()) return;
  const button = document.querySelector("#send-quiz-result");
  const status = document.querySelector("#quiz-send-status");
  const label = button.innerHTML;
  button.disabled = true;
  button.textContent = "Отправляю…";
  status.textContent = "Соединяюсь с FormSubmit…";
  try {
    const response = await fetch(quizEmailForm.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(quizEmailForm).entries())),
    });
    const result = await response.json();
    if (!response.ok || result.success === "false" || result.success === false) throw new Error(result.message || "Отправка не удалась.");
    status.textContent = "Результат передан FormSubmit. При первой отправке подтверди форму письмом из почты ♡";
    document.querySelector("#quiz-consent").checked = false;
    button.textContent = "Отправлено ✓";
    window.setTimeout(() => { button.disabled = false; button.innerHTML = label; }, 2200);
  } catch {
    status.textContent = "Не получилось отправить. Проверь интернет и попробуй ещё раз.";
    button.disabled = false;
    button.innerHTML = label;
  }
});

const dateConfirmation = document.querySelector("#date-confirmation");
const dateChoices = [...document.querySelectorAll(".date-option")];
let savedDateIdea = "";
try { savedDateIdea = localStorage.getItem("twoMonthDateIdea") || ""; } catch { /* The date picker still works without storage. */ }
function chooseDate(choice) {
  dateChoices.forEach(button => {
    const selected = button.dataset.date === choice;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  if (choice) dateConfirmation.textContent = `Запомнил: «${choice}». Если что, не знаю, как это до меня дойдёт: не получилось настроить отправку формы, так что скинь мне просто в Telegram :)) ♡`;
}
dateChoices.forEach(button => button.addEventListener("click", () => {
  const choice = button.dataset.date;
  try { localStorage.setItem("twoMonthDateIdea", choice); } catch { /* Keep the choice for this view. */ }
  chooseDate(choice);
}));

const photoViewer = document.querySelector("#photo-viewer");
const viewerImage = document.querySelector("#viewer-image");
document.querySelectorAll(".album-item").forEach(button => button.addEventListener("click", () => {
  viewerImage.src = button.dataset.photo;
  viewerImage.alt = button.querySelector("img").alt;
  document.querySelector("#viewer-caption").textContent = button.dataset.caption;
  photoViewer.showModal();
}));
document.querySelector("#viewer-close").addEventListener("click", () => photoViewer.close());
photoViewer.addEventListener("click", event => { if (event.target === photoViewer) photoViewer.close(); });

renderEditor();
renderQuestion();
chooseDate(savedDateIdea);
