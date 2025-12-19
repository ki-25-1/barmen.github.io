import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, doc, setDoc, updateDoc, 
    addDoc, serverTimestamp, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// КОНФІГУРАЦІЯ FIREBASE (Вставте свої дані тут)
const firebaseConfig = {
  apiKey: "AIzaSyBsAur0eQCEn6H127HBJZgPm5wklMHGNQc",
  authDomain: "barmen-app.firebaseapp.com",
  projectId: "barmen-app",
  storageBucket: "barmen-app.firebasestorage.app",
  messagingSenderId: "173684350688",
  appId: "1:173684350688:web:6a921f6e067c32402afa85"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Відображення поточної дати
document.getElementById('current-date').innerText = new Date().toLocaleDateString('uk-UA');

// Функція для відмальовування таблиці
// ... (Ваш каталог PRODUCT_CATALOG та ініціалізація Firebase залишаються)

function renderTable(items) {
    const tbody = document.getElementById('inventory-body');
    tbody.innerHTML = '';

    items.forEach(item => {
        // Перевірка, чи це розливне пиво (літри)
        const isBeerLiters = item.name.toLowerCase().includes('пиво') && item.unit === 'л';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-size: 0.8em; color: #7f8c8d;">${item.id}</td>
            <td><strong>${item.name}</strong></td>
            <td style="text-align: center;">${item.amount.toFixed(3)} ${item.unit}</td>
            <td style="text-align: right;">
                <div class="sale-group">
                    <input type="number" id="input-${item.id}" 
                           step="${isBeerLiters ? '1' : '0.001'}" 
                           placeholder="${isBeerLiters ? 'Порції' : (item.unit === 'л' ? 'Літри' : 'Шт')}" 
                           class="qty-input">
                    <button class="btn-sale-action" onclick="window.processSale('${item.id}', ${isBeerLiters})">Вибити</button>
                </div>
                <button class="btn-restock" onclick="window.handleRestock('${item.id}')">Поставка</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Нова функція для обробки продажу
window.processSale = async (id, isBeer) => {
    const input = document.getElementById(`input-${id}`);
    const value = parseFloat(input.value);

    if (!value || value <= 0) {
        alert("Будь ласка, введіть коректну кількість");
        return;
    }

    let changeAmount;
    if (isBeer) {
        // Якщо пиво — множимо кількість порцій на 0.4л
        changeAmount = -(value * 0.4);
    } else {
        // Для інших — віднімаємо введене значення (літри або штуки)
        changeAmount = -value;
    }

    // Викликаємо існуючу функцію handleAction
    await window.handleAction(id, changeAmount, 'sale');
    
    // Очищаємо поле після успішної операції
    input.value = '';
};


// Слухач бази даних (оновлюється миттєво при змінах)
onSnapshot(collection(db, "inventory"), (snapshot) => {
    const items = [];
    snapshot.forEach(doc => {
        items.push({ ...doc.data(), id: doc.id });
    });
    renderTable(items);
});

// Функція обробки натискань (Списання)
window.handleAction = async (id, change, type) => {
    const itemRef = doc(db, "inventory", id);
    
    // Знаходимо поточний об'єкт у локальному списку для перевірки залишку
    // В реальному проекті краще робити транзакцію Firestore
    const newAmount = window.currentData[id] + change;

    if (newAmount < 0) {
        alert("Помилка: Недостатньо залишку!");
        return;
    }

    await updateDoc(itemRef, { amount: newAmount });

    // Запис логу операції
    await addDoc(collection(db, "history"), {
        positionId: id,
        change: change,
        type: type,
        time: serverTimestamp()
    });
};

// Функція для ручного поповнення (Поставка)
window.handleRestock = (id) => {
    const value = prompt("Скільки прийшло товару (в літрах/шт)?");
    if (value && !isNaN(value)) {
        window.handleAction(id, parseFloat(value), 'restock');
    }
};

// Локальний кеш для швидкої перевірки залишків
window.currentData = {};
onSnapshot(collection(db, "inventory"), (snapshot) => {
    snapshot.forEach(doc => {
        window.currentData[doc.id] = doc.data().amount;
    });
});


// ... (Ваш конфіг Firebase залишається без змін)

// БАЗА ДАНИХ З ВАШОГО ФОТО
const PRODUCT_CATALOG = [
    { id: "2204218200", name: "вино Дон Сімон Кабарне", unit: "л" },
    { id: "2204218100", name: "Вино ДС біле Савіньйон бланк", unit: "л" },
    { id: "2208701000", name: "Лікер Вишнева спокуса", unit: "л" },
    { id: "2202991900", name: "Вино безалк. червоне біле", unit: "л" },
    { id: "2208601100", name: "горілка Козацька Рада", unit: "л" },
    { id: "2203001000", name: "пиво Варштайнер", unit: "л" },
    { id: "2208201200", name: "коньяк Закарпатський 4*", unit: "л" },
    { id: "2203001000_1", name: "пиво КРОНЕНБУРГ", unit: "л" },
    { id: "2208701000_1", name: "Лікер Вишн спок смор", unit: "л" },
    { id: "2204109800", name: "шампанське Маренго Брют", unit: "шт" },
    { id: "2202991900_1", name: "Шамп безалк. біле", unit: "шт" },
    { id: "2208906900", name: "ром Кептен Морган спайсед", unit: "л" },
    { id: "2208308200", name: "віскі Джеймісон", unit: "л" },
    { id: "2203000900", name: "Пиво Будвайзер", unit: "шт" },
    { id: "2203000900_1", name: "пиво Гамбрінус", unit: "шт" }
];

// 1. Заповнюємо випадаючий список при завантаженні
const nameSelect = document.getElementById('new-name-select');
PRODUCT_CATALOG.forEach(item => {
    let opt = document.createElement('option');
    opt.value = item.id; // зберігаємо ID як значення
    opt.innerHTML = item.name;
    nameSelect.appendChild(opt);
});

// 2. АВТОПІДБІР: Слухаємо зміну вибору у списку
nameSelect.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    const product = PRODUCT_CATALOG.find(p => p.id === selectedId);

    if (product) {
        document.getElementById('new-id').value = product.id;
        document.getElementById('new-unit').value = product.unit;
    }
});

// 3. Збереження поставки (оновлений обробник форми)
document.getElementById('add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('new-id').value;
    const name = nameSelect.options[nameSelect.selectedIndex].text;
    const unit = document.getElementById('new-unit').value;
    const addAmount = parseFloat(document.getElementById('new-amount').value);

    // Отримуємо поточний залишок з бази або 0
    const currentVal = window.currentData[id] || 0;
    const newTotal = currentVal + addAmount;

    await setDoc(doc(db, "inventory", id), {
        name: name,
        unit: unit,
        amount: newTotal
    }, { merge: true });

    alert(`Додано ${addAmount} до ${name}`);
    e.target.reset();
});

// ... (інший код handleAction та onSnapshot залишається)
import { 
    query, where, getDocs, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Встановлюємо сьогоднішню дату за замовчуванням у пікер
const datePicker = document.getElementById('report-date-picker');
datePicker.valueAsDate = new Date();

document.getElementById('btn-generate-report').addEventListener('click', async () => {
    const selectedDate = new Date(datePicker.value);
    
    // Встановлюємо часові межі: початок дня (00:00) та кінець дня (23:59)
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    const historyRef = collection(db, "history");
    const q = query(
        historyRef, 
        where("time", ">=", Timestamp.fromDate(startOfDay)),
        where("time", "<=", Timestamp.fromDate(endOfDay))
    );

    const querySnapshot = await getDocs(q);
    const reportData = {};

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const pid = data.positionId;

        if (!reportData[pid]) {
            // Знаходимо назву з нашого каталогу
            const prodInfo = PRODUCT_CATALOG.find(p => p.id === pid) || { name: "Невідомий товар" };
            reportData[pid] = { name: prodInfo.name, total: 0 };
        }
        
        // Додаємо тільки від'ємні значення (продажі)
        if (data.type === 'sale') {
            reportData[pid].total += Math.abs(data.change);
        }
    });

    displayReport(reportData);
});

function displayReport(data) {
    const reportBody = document.getElementById('report-body');
    const reportDiv = document.getElementById('report-results');
    reportBody.innerHTML = '';

    if (Object.keys(data).length === 0) {
        reportBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">За цей день продажів не знайдено</td></tr>';
    } else {
        for (const id in data) {
            const row = `
                <tr>
                    <td>${data[id].name}</td>
                    <td><strong>${data[id].total.toFixed(3)}</strong></td>
                    <td><span style="color:red;">Списання</span></td>
                </tr>`;
            reportBody.insertAdjacentHTML('beforeend', row);
        }
    }
    reportDiv.classList.remove('hidden');
}

      
