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
function renderTable(items) {
    const tbody = document.getElementById('inventory-body');
    tbody.innerHTML = '';

    items.forEach(item => {
        const isBeer = item.name.toLowerCase().includes('пиво') && item.unit === 'л';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-size: 0.8em; color: #7f8c8d;">${item.id}</td>
            <td><strong>${item.name}</strong></td>
            <td style="text-align: center;">${item.amount.toFixed(3)} ${item.unit}</td>
            <td style="text-align: right;">
                <button class="btn-sale" onclick="window.handleAction('${item.id}', -0.05, 'sale')">-50г</button>
                ${isBeer ? `<button class="btn-sale btn-beer" onclick="window.handleAction('${item.id}', -0.4, 'sale')">-0.4л</button>` : ''}
                <button class="btn-restock" onclick="window.handleRestock('${item.id}')">Поставка</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

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

// Додавання нової позиції через форму
document.getElementById('add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('new-id').value;
    const name = document.getElementById('new-name').value;
    const unit = document.getElementById('new-unit').value;
    const amount = parseFloat(document.getElementById('new-amount').value);

    await setDoc(doc(db, "inventory", id), {
        name: name,
        unit: unit,
        amount: amount
    });

    e.target.reset();
});
      
