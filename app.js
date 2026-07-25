const sourceText = document.getElementById("sourceText");
const translateButton = document.getElementById("translateButton");
const sampleDocButton = document.getElementById("sampleDocButton");
const translationOutput = document.getElementById("translationOutput");
const docUpload = document.getElementById("docUpload");
const documentPreview = document.getElementById("documentPreview");
const uploadState = document.getElementById("uploadState");
const speakButton = document.getElementById("speakButton");
const stopButton = document.getElementById("stopButton");
const difficulty = document.getElementById("difficulty");
const sentenceLength = document.getElementById("sentenceLength");
const speechRate = document.getElementById("speechRate");
const usePictogram = document.getElementById("usePictogram");
const focusMode = document.getElementById("focusMode");

const sampleDocuments = [
  "본 우편물은 기한 내 제출하지 않을 경우 서비스 이용에 제한이 발생할 수 있으니 관련 서류를 빠짐없이 준비하여 주민센터에 방문하시기 바랍니다.",
  "고객님의 계좌에서 이상 거래가 감지되어 본인 확인이 필요합니다. 안내된 번호로 즉시 연락하여 조치를 진행하시기 바랍니다.",
  "복지서비스 재판정을 위해 다음 주 화요일까지 필요한 서류를 준비하여 담당 기관에 제출해 주세요."
];

const rewriteMap = [
  { from: "우편물", to: "종이" },
  { from: "기한 내", to: "정해진 날 안에" },
  { from: "제출", to: "내기" },
  { from: "서비스 이용", to: "서비스 사용" },
  { from: "제한", to: "못 쓰게 됨" },
  { from: "발생할 수 있으니", to: "될 수 있어요. 그래서" },
  { from: "관련 서류", to: "필요한 종이" },
  { from: "빠짐없이", to: "다" },
  { from: "준비하여", to: "챙겨서" },
  { from: "주민센터에 방문하시기 바랍니다", to: "주민센터에 가면 돼요" },
  { from: "이상 거래", to: "이상한 돈 움직임" },
  { from: "감지되어", to: "보여서" },
  { from: "본인 확인", to: "내가 맞는지 확인" },
  { from: "즉시", to: "바로" },
  { from: "조치를 진행하시기 바랍니다", to: "도움을 받아야 해요" },
  { from: "재판정", to: "다시 확인" },
  { from: "담당 기관", to: "도와주는 곳" }
];

const pictograms = ["📬", "📄", "🏢", "☎️", "🪪", "✅", "💬", "🧡"];

let currentSentences = [];
let activeTimer = null;

function splitSentences(text) {
  return text
    .replace(/\n/g, " ")
    .split(/[.!?]|다\./)
    .map((part) => part.trim())
    .filter(Boolean);
}

function applyRewriteLevel(text, level) {
  let result = text;
  for (const pair of rewriteMap) {
    result = result.replaceAll(pair.from, pair.to);
  }

  if (level === "very-easy") {
    result = result
      .replaceAll("경우", "때")
      .replaceAll("필요합니다", "필요해요")
      .replaceAll("주시기 바랍니다", "해 주세요")
      .replaceAll("하세요", "해요");
  }

  return result;
}

function buildEasySentences() {
  const source = sourceText.value.trim();
  if (!source) {
    return [];
  }

  const level = difficulty.value;
  const lengthMode = sentenceLength.value;
  const rewritten = applyRewriteLevel(source, level);
  const baseSentences = splitSentences(rewritten);
  const easySentences = [];

  baseSentences.forEach((sentence) => {
    if (lengthMode === "short") {
      const chunks = sentence
        .replaceAll("그래서", "그래서|")
        .replaceAll("그리고", "그리고|")
        .split("|")
        .map((chunk) => chunk.trim())
        .filter(Boolean);
      easySentences.push(...chunks);
      return;
    }
    easySentences.push(sentence);
  });

  return easySentences.map((sentence, index) => ({
    id: index + 1,
    text: sentence.endsWith("요") ? sentence : `${sentence}.`,
    icon: pictograms[index % pictograms.length]
  }));
}

function renderTranslation(sentences) {
  currentSentences = sentences;
  window.speechSynthesis.cancel();

  if (!sentences.length) {
    translationOutput.innerHTML = '<p class="placeholder">원문을 입력하면 쉬운말 결과가 표시됩니다.</p>';
    return;
  }

  const summary = document.createElement("div");
  summary.className = "summary-banner";
  summary.innerHTML = `
    <strong>한눈에 보기</strong>
    <span>중요한 내용만 짧고 분명하게 나눠서 보여주고 있어요.</span>
  `;

  translationOutput.innerHTML = "";
  translationOutput.appendChild(summary);

  sentences.forEach((sentence) => {
    const card = document.createElement("section");
    card.className = "easy-sentence";
    card.dataset.id = String(sentence.id);

    const iconMarkup = usePictogram.checked
      ? `<span class="pictogram" aria-hidden="true">${sentence.icon}</span>`
      : "";

    card.innerHTML = `
      <div class="sentence-head">
        ${iconMarkup}
        <div>
          <p class="sentence-label">쉬운말 ${sentence.id}</p>
          <p class="sentence-text">${sentence.text}</p>
        </div>
      </div>
    `;

    translationOutput.appendChild(card);
  });
}

function speakSentences() {
  if (!currentSentences.length || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  clearTimeout(activeTimer);

  currentSentences.forEach((sentence, index) => {
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    utterance.lang = "ko-KR";
    utterance.rate = Number(speechRate.value);

    utterance.onstart = () => {
      if (!focusMode.checked) {
        return;
      }

      document.querySelectorAll(".easy-sentence").forEach((node) => {
        node.classList.toggle("active", node.dataset.id === String(sentence.id));
      });
    };

    utterance.onend = () => {
      if (index === currentSentences.length - 1) {
        activeTimer = setTimeout(() => {
          document.querySelectorAll(".easy-sentence").forEach((node) => {
            node.classList.remove("active");
          });
        }, 400);
      }
    };

    window.speechSynthesis.speak(utterance);
  });
}

function renderDocumentPreview(file) {
  if (!file) {
    documentPreview.innerHTML = "<p>촬영한 문서 이미지가 이곳에 보입니다.</p>";
    uploadState.textContent = "샘플 문서 대기 중";
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    documentPreview.innerHTML = `<img src="${event.target.result}" alt="업로드한 문서 미리보기">`;
    uploadState.textContent = `업로드 완료: ${file.name}`;
  };
  reader.readAsDataURL(file);
}

function translateNow() {
  const easySentences = buildEasySentences();
  renderTranslation(easySentences);
}

sampleDocButton.addEventListener("click", () => {
  const next = sampleDocuments[Math.floor(Math.random() * sampleDocuments.length)];
  sourceText.value = next;
  translateNow();
});

translateButton.addEventListener("click", translateNow);
speakButton.addEventListener("click", speakSentences);
stopButton.addEventListener("click", () => {
  window.speechSynthesis.cancel();
  document.querySelectorAll(".easy-sentence").forEach((node) => {
    node.classList.remove("active");
  });
});

docUpload.addEventListener("change", (event) => {
  const [file] = event.target.files;
  renderDocumentPreview(file);
});

[difficulty, sentenceLength, usePictogram].forEach((input) => {
  input.addEventListener("change", translateNow);
});

translateNow();
