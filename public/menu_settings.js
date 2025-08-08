document.addEventListener('DOMContentLoaded', function() {
    const menuItemForm = document.getElementById('menuItemForm');
    const itemIdToEditInput = document.getElementById('itemIdToEdit');
    const itemNameInput = document.getElementById('itemName');
    const itemPriceInput = document.getElementById('itemPrice');
    const itemCategorySelect = document.getElementById('itemCategory');
    const saveMenuItemBtn = document.getElementById('saveMenuItemBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const currentMenuItemsDiv = document.getElementById('currentMenuItems');
    const backToPosBtn = document.getElementById('backToPosBtn');

    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');

    // ハンバーガーメニューのクリックイベント
    hamburgerMenu.addEventListener('click', function() {
        hamburgerMenu.classList.toggle('open');
        sideMenu.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    // オーバーレイのクリックイベント (メニューを閉じる)
    overlay.addEventListener('click', function() {
        hamburgerMenu.classList.remove('open');
        sideMenu.classList.remove('open');
        overlay.classList.remove('active');
    });

    // ローカルストレージからメニューデータを取得
    function getMenuItems() {
        const defaultMenuItems = {
            'coffee': [
                { id: 'lightRoast', name: '浅煎り', price: 400, category: 'coffee' },
                { id: 'darkRoast', name: '深煎り', price: 400, category: 'coffee' },
                { id: 'premium', name: 'プレミアム', price: 500, category: 'coffee' },
                { id: 'decaf', name: 'デカフェ', price: 400, category: 'coffee' },
                { id: 'iceCoffee', name: 'アイスコーヒー', price: 400, category: 'coffee' },
                { id: 'iceLatte', name: 'アイスカフェオレ', price: 450, category: 'coffee' }
            ],
            'softDrink': [
                { id: 'lemonade', name: 'レモネード', price: 300, category: 'softDrink' },
                { id: 'appleJuice', name: 'アップルジュース', price: 300, category: 'softDrink' },
                { id: 'icedTea', name: 'アイスティー', price: 300, category: 'softDrink' },
                { id: 'milk', name: 'アイスミルク', price: 300, category: 'softDrink' }
            ],
            'food': [
                { id: 'chocolate', name: 'チョコレート', price: 150, category: 'food' },
                { id: 'cookie', name: 'クッキー', price: 150, category: 'food' },
                { id: 'madeleine', name: 'マドレーヌ', price: 150, category: 'food' },
                { id: 'financier', name: 'フィナンシェ', price: 150, category: 'food' }
            ],
            'other': [
                { id: 'dip', name: 'ディップ', price: 200, category: 'other' },
                { id: 'dipx5', name: 'ディップ ×5', price: 1000, category: 'other' },
                { id: 'sticker', name: 'ステッカー', price: 100, category: 'other' }
            ]
        };
        const storedMenu = JSON.parse(localStorage.getItem('posMenuItems'));
        return storedMenu || defaultMenuItems;
    }

    // メニューデータをローカルストレージに保存
    function saveMenuItems(menuItems) {
        localStorage.setItem('posMenuItems', JSON.stringify(menuItems));
    }

    // メニューアイテムを画面に表示
    function displayMenuItems() {
        currentMenuItemsDiv.innerHTML = '';
        const menuItems = getMenuItems();

        for (const category in menuItems) {
            if (menuItems[category].length > 0) {
                const categoryHeader = document.createElement('h4');
                categoryHeader.textContent = getCategoryDisplayName(category);
                currentMenuItemsDiv.appendChild(categoryHeader);

                const ul = document.createElement('ul');
                ul.className = 'menu-list-items';
                menuItems[category].forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${item.name} (¥${item.price}) - ${getCategoryDisplayName(item.category)}</span>
                        <div class="item-actions">
                            <button class="btn btn-edit" data-item-id="${item.id}">編集</button>
                            <button class="btn btn-delete" data-item-id="${item.id}">削除</button>
                        </div>
                    `;
                    ul.appendChild(li);
                });
                currentMenuItemsDiv.appendChild(ul);
            }
        }

        // 編集・削除ボタンにイベントリスナーを設定
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', editMenuItem);
        });
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', deleteMenuItem);
        });
    }

    // カテゴリ表示名を取得
    function getCategoryDisplayName(category) {
        switch (category) {
            case 'coffee': return 'コーヒー';
            case 'softDrink': return 'ソフトドリンク';
            case 'food': return 'フード';
            case 'other': return 'その他';
            default: return category;
        }
    }

    // 商品追加・編集フォームの送信イベント
    menuItemForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const id = itemIdToEditInput.value || 'item_' + Date.now();
        const name = itemNameInput.value;
        const price = parseInt(itemPriceInput.value);
        const category = itemCategorySelect.value;

        const menuItems = getMenuItems();

        let isEditing = false;
        // 既存アイテムの更新
        for (const cat in menuItems) {
            const itemIndex = menuItems[cat].findIndex(item => item.id === id);
            if (itemIndex !== -1) {
                menuItems[cat][itemIndex] = { id, name, price, category };
                // カテゴリが変わった場合は移動
                if (cat !== category) {
                    menuItems[cat].splice(itemIndex, 1);
                    if (!menuItems[category]) {
                        menuItems[category] = [];
                    }
                    menuItems[category].push({ id, name, price, category });
                }
                isEditing = true;
                break;
            }
        }

        // 新規アイテムの追加
        if (!isEditing) {
            if (!menuItems[category]) {
                menuItems[category] = [];
            }
            menuItems[category].push({ id, name, price, category });
        }

        saveMenuItems(menuItems);
        displayMenuItems();
        resetForm();
    });

    // 商品編集ボタンのクリックイベント
    function editMenuItem(event) {
        const itemId = event.target.dataset.itemId;
        const menuItems = getMenuItems();
        let itemToEdit = null;

        for (const category in menuItems) {
            itemToEdit = menuItems[category].find(item => item.id === itemId);
            if (itemToEdit) {
                break;
            }
        }

        if (itemToEdit) {
            itemIdToEditInput.value = itemToEdit.id;
            itemNameInput.value = itemToEdit.name;
            itemPriceInput.value = itemToEdit.price;
            itemCategorySelect.value = itemToEdit.category;
            saveMenuItemBtn.textContent = '商品を更新';
            cancelEditBtn.style.display = 'inline-block';
        }
    }

    // 編集キャンセルボタンのクリックイベント
    cancelEditBtn.addEventListener('click', resetForm);

    // フォームをリセット
    function resetForm() {
        itemIdToEditInput.value = '';
        itemNameInput.value = '';
        itemPriceInput.value = '';
        itemCategorySelect.value = 'coffee';
        saveMenuItemBtn.textContent = '商品を追加';
        cancelEditBtn.style.display = 'none';
    }

    // 商品削除ボタンのクリックイベント
    function deleteMenuItem(event) {
        if (!confirm('本当にこの商品を削除しますか？')) {
            return;
        }

        const itemId = event.target.dataset.itemId;
        const menuItems = getMenuItems();

        for (const category in menuItems) {
            const itemIndex = menuItems[category].findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                menuItems[category].splice(itemIndex, 1);
                break;
            }
        }
        saveMenuItems(menuItems);
        displayMenuItems();
    }

    // 初回表示
    displayMenuItems();

    // POSレジに戻るボタン
    backToPosBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
});