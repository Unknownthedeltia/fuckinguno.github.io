const colors = ["red", "orange", "yellow", "yellowgreen", "green", "teal", "aqua", "blue", "indigo", "purple", "magenta", "pink"];
const deck = [];
const playerHand = [];
const cpuHand = [];
let discardPile = [];
let currentTurn = "player";
let drawStack = 0;

function createDeck() {
    colors.forEach(color => {
        deck.push({ color, value: 0 });
        for (let i = 1; i <= 19; i++) {
            deck.push({ color, value: i });
            deck.push({ color, value: i });
        }
        deck.push({ color, value: "+2" });
        deck.push({ color, value: "+2" });
    });
    for (let i = 0; i < 12; i++) {
        deck.push({ color: "black", value: "wild" });
        deck.push({ color: "black", value: "+4" });
        deck.push({ color: "black", value: "+6" });
        deck.push({ color: "black", value: "+10" });
    };
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function init() {
    deck.length = 0;
    playerHand.length = 0;
    cpuHand.length = 0;
    discardPile.length = 0;
    createDeck();
    shuffle(deck);
    const handSize = parseInt(document.getElementById("hand-size").value);
    for (let i = 0; i < handSize; i++) {
        playerHand.push(deck.pop());
        cpuHand.push(deck.pop());
    }
    discardPile.push(deck.pop());
    drawStack = 0;
    currentTurn = "player";
    renderHands();
    renderDiscard();
    updateDeckCount();
}

function renderHands() {
    const playerDiv = document.getElementById("player-hand");
    playerDiv.innerHTML = "";
    playerHand.forEach((card, index) => {
        const cardDiv = document.createElement("div");
        cardDiv.className = "card";
        cardDiv.style.backgroundColor = card.color;
        cardDiv.textContent = card.value;
        cardDiv.onclick = () => playCard(index);
        playerDiv.appendChild(cardDiv);
    });
    const cpuDiv = document.getElementById("cpu-hand");
    cpuDiv.innerHTML = `CPU手札: ${cpuHand.length}枚`;
}

function renderDiscard() {
    const topCard = discardPile[discardPile.length - 1];
    document.getElementById("current-card").textContent = `${topCard.chosenColor || topCard.color} ${topCard.value}`;
}

function updateDeckCount() {
    if (deck.length === 0) {
        if (discardPile.length > 1) {
            const topCard = discardPile.pop();
            deck.push(...discardPile);
            shuffle(deck);
            discardPile = [topCard];
        } else {
            alert("デッキが尽きました。引き分けです。");
            return false;
        }
    }
    document.getElementById("deck-count").textContent = deck.length;
    return true;
}

function playCard(index) {
    if (currentTurn !== "player") return;
    const card = playerHand[index];
    const topCard = discardPile[discardPile.length - 1];
    if (canPlay(card, topCard)) {
        if (card.color === "black") {
            showColorModal(index);
        } else {
            discardPile.push(card);
            playerHand.splice(index, 1);
            updateDrawStack(card);
            finishTurn();
        }
    }
}

function showColorModal(index) {
    const modal = document.createElement("div");
    modal.id = "color-modal";
    colors.forEach(color => {
        const btn = document.createElement("button");
        btn.className = `color-btn ${color}`;
        btn.textContent = color;
        btn.onclick = () => {
            const card = { ...playerHand[index], color: color }; // chosenColorではなくcolorを直接変更
            discardPile.push(card);
            playerHand.splice(index, 1);
            updateDrawStack(card);
            modal.remove();
            finishTurn();
        };
        modal.appendChild(btn);
    });
    const cancel = document.createElement("button");
    cancel.textContent = "キャンセル";
    cancel.className = "color-btn";
    cancel.onclick = () => modal.remove();
    modal.appendChild(cancel);
    document.body.appendChild(modal);
}

function canPlay(card, topCard) {
    const valueMap = { "+2": 2, "+4": 4, "+6": 6, "+10": 10 };
    if (drawStack > 0) {
        if (!valueMap[card.value]) return false;
        const topValue = valueMap[topCard.value] || 0;
        const cardValue = valueMap[card.value];
        return cardValue >= topValue;
    }
    if (card.color === "black") return true;
    if (card.color === (topCard.chosenColor || topCard.color) || card.value === topCard.value) return true;
    if (valueMap[topCard.value] && valueMap[card.value] && valueMap[card.value] >= valueMap[topCard.value]) return true;
    return false;
}

function updateDrawStack(card) {
    const valueMap = { "+2": 2, "+4": 4, "+6": 6, "+10": 10 };
    if (valueMap[card.value]) {
        drawStack += valueMap[card.value];
    }
}

function drawCard() {
    if (currentTurn !== "player") return;
    if (drawStack > 0) {
        // ドロースタックがある場合、強制ドロー
        for (let i = 0; i < drawStack && deck.length > 0; i++) {
            playerHand.push(deck.pop());
        }
        drawStack = 0;
        renderHands();
        finishTurn();
    } else {
        // 通常ドロー
        playerHand.push(deck.pop());
        renderHands();
        updateDeckCount();
        finishTurn();
    }
}

function finishTurn() {
    renderHands();
    renderDiscard();
    if (!updateDeckCount()) return;
    if (playerHand.length === 0 && !discardPile[discardPile.length - 1].value.includes("+")) {
        alert("プレイヤーの勝利！");
        return;
    }
    if (cpuHand.length === 0 && !discardPile[discardPile.length - 1].value.includes("+")) {
        alert("CPUの勝利！");
        return;
    }
    currentTurn = currentTurn === "player" ? "cpu" : "player";
    if (drawStack > 0) {
        const playable = currentTurn === "player" ?
            playerHand.some(card => canPlay(card, discardPile[discardPile.length - 1])) :
            cpuHand.some(card => canPlay(card, discardPile[discardPile.length - 1]));
        if (!playable && currentTurn !== "player") { // CPUの場合のみ自動ドロー
            const hand = cpuHand;
            for (let i = 0; i < drawStack && deck.length > 0; i++) hand.push(deck.pop());
            drawStack = 0;
            renderHands();
            currentTurn = "player";
        }
    }
    if (currentTurn === "cpu") setTimeout(cpuTurn, 1000);
}

function cpuTurn() {
    const topCard = discardPile[discardPile.length - 1];
    const playable = cpuHand.findIndex(card => canPlay(card, topCard));
    if (playable !== -1) {
        const card = cpuHand[playable];
        if (card.color === "black") {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            discardPile.push({ ...card, color: randomColor }); // CPUも色を変更
        } else {
            discardPile.push(card);
        }
        cpuHand.splice(playable, 1);
        updateDrawStack(card);
    } else if (drawStack === 0) {
        cpuHand.push(deck.pop());
    }
    finishTurn();
}

// 手札枚数選択肢
for (let i = 7; i <= 20; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    if (i === 14) option.selected = true;
    document.getElementById("hand-size").appendChild(option);
}

// 引くボタンのイベント
document.getElementById("draw-btn").addEventListener("click", drawCard);

// モードトグル
const modeToggle = document.getElementById("mode-toggle");
modeToggle.addEventListener("click", () => {
    const body = document.body;
    if (body.getAttribute("data-theme") === "dark") {
        body.removeAttribute("data-theme");
        modeToggle.textContent = "ダークモード";
    } else {
        body.setAttribute("data-theme", "dark");
        modeToggle.textContent = "ライトモード";
    }
});

let timer;
let startTime;
let elapsedTime = 0;
let running = false;

function updateTime() {
    const currentTime = Date.now() - startTime + elapsedTime;
    const milliseconds = Math.floor((currentTime % 1000) / 10);
    const seconds = Math.floor((currentTime / 1000) % 60);
    const minutes = Math.floor((currentTime / 1000 / 60) % 60);
    const hours = Math.floor((currentTime / 1000 / 60 / 60));
    document.getElementById('time').textContent = 
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0') + '.' +
        String(milliseconds).padStart(2, '0');
}

function start() {
    if (!running) {
        startTime = Date.now();
        timer = setInterval(updateTime, 10);
        running = true;
    }
}

function stop() {
    if (running) {
        clearInterval(timer);
        elapsedTime += Date.now() - startTime;
        running = false;
    }
}

function reset() {
    clearInterval(timer);
    elapsedTime = 0;
    running = false;
    document.getElementById('time').textContent = "00:00:00.00";
}

init();