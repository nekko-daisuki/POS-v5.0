document.addEventListener('DOMContentLoaded', function() {
    const orderManagementList = document.getElementById('orderManagementList');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    const filterButtons = document.querySelectorAll('.filter-btn');

    let allOrders = JSON.parse(localStorage.getItem('posOrderManagement')) || [];
    let currentFilter = 'all';

    // ステータスを切り替える関数
    function toggleStatus(orderId, itemUniqueId) {
        const order = allOrders.find(o => o.id === parseInt(orderId));
        if (!order) return;

        // itemUniqueIdは 'originalItemId_index' の形式
        const [originalItemId, itemIndex] = itemUniqueId.split('_');
        const item = order.items[itemIndex];

        if (!item) return;

        // ステータスの切り替えロジック
        switch (item.status) {
            case 'pending':
                item.status = 'delivered';
                break;
            case 'delivered':
                item.status = 'cancelled';
                break;
            case 'cancelled':
                item.status = 'pending';
                break;
            default:
                item.status = 'pending';
        }

        // 変更をlocalStorageに保存
        localStorage.setItem('posOrderManagement', JSON.stringify(allOrders));
        // 表示を更新
        displayOrders();
    }

    // 注文を表示する関数
    function displayOrders() {
        orderManagementList.innerHTML = '';

        let itemsToDisplay = [];

        allOrders.slice().reverse().forEach(order => {
            const orderDate = new Date(order.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            const tableInfo = order.tableNumber === 'Takeout' ? 'テイクアウト' : `テーブル: ${order.tableNumber}`;

            order.items.forEach((item, index) => {
                // 各アイテムにユニークなIDを付与（orderIdと元のitemIdとインデックスを組み合わせる）
                const itemUniqueId = `${item.id}_${index}`;

                // 数量分だけ個別の表示アイテムを作成
                for (let i = 0; i < item.quantity; i++) {
                    itemsToDisplay.push({
                        orderId: order.id,
                        itemUniqueId: itemUniqueId,
                        itemName: item.name,
                        status: item.status,
                        orderDate: orderDate,
                        tableInfo: tableInfo
                    });
                }
            });
        });

        // フィルターを適用
        const filteredItems = itemsToDisplay.filter(item => {
            if (currentFilter === 'all') return true;
            return item.status === currentFilter;
        });

        if (filteredItems.length === 0) {
            orderManagementList.innerHTML = '<p>表示する注文がありません。</p>';
            return;
        }

        filteredItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = `order-management-item status-${item.status}`;
            itemElement.setAttribute('data-order-id', item.orderId);
            itemElement.setAttribute('data-item-unique-id', item.itemUniqueId);

            itemElement.innerHTML = `
                <div class="item-header">
                    <span class="item-time">${item.orderDate}</span>
                    <span class="item-table">${item.tableInfo}</span>
                </div>
                <div class="item-details">
                    <span class="item-name">${item.itemName}</span>
                    <span class="item-status-text">${getStatusText(item.status)}</span>
                </div>
            `;
            orderManagementList.appendChild(itemElement);
        });

        // クリックイベントを各アイテムに設定
        document.querySelectorAll('.order-management-item').forEach(item => {
            item.addEventListener('click', function() {
                const orderId = this.getAttribute('data-order-id');
                const itemUniqueId = this.getAttribute('data-item-unique-id');
                toggleStatus(orderId, itemUniqueId);
            });
        });
    }

    // ステータスの日本語テキストを取得
    function getStatusText(status) {
        switch (status) {
            case 'pending': return '未提供';
            case 'delivered': return '提供済み';
            case 'cancelled': return 'キャンセル';
            default: return '不明';
        }
    }

    // フィルターボタンのイベントリスナー
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            displayOrders();
        });
    });

    // ハンバーガーメニューのイベント
    hamburgerMenu.addEventListener('click', () => {
        sideMenu.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sideMenu.classList.remove('open');
        overlay.classList.remove('active');
    });

    // 初回表示
    displayOrders();
});