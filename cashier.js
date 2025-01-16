let lunchAppStat = "no";
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw/service-worker.js').then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
    }).catch((error) => {
        console.log('Service Worker registration failed:', error);
    });
}

function launchCustomProtocol() {

    try {
        const appURL = "bing-desktop-app-v1.0.0://open-url";
        window.location.href = appURL;
    } catch (error) {
        setTimeout(() => {
            // Redirect to a download or help page
            //window.location.href = "https://example.com/download-app";
            alert('Game Console not found');
        }, 1000); // Adjust delay as needed
    }
}
import { db } from './db.js';
import { collection, addDoc, setDoc, doc, getDoc, getDocs, limit, where, query, updateDoc, arrayUnion, arrayRemove, deleteDoc, orderBy, onSnapshot, Timestamp, writeBatch } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {signOut, getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const auth = getAuth();

// Handle drawing a number (simulated)
let drawnNumbers = [];

// Function to start the game and continuously draw numbers
let firstDraw = true; // Flag to track if it's the first draw
let drawInterval; // Variable to hold the setInterval reference

let isPaused = false; // Flag to track if the drawing is paused
let GameStatusPage = "reload";
let batchGameEnd1 = null;
let batchGameEnd2 = null;
let docBackup1 = [];
let docBackup2 = [];
let docBackup3 = [];
let counterID = 0;

$('.loader').show();


//---------------------connect web client with game console------------------------//
let wsClient;
const overlaySocket = document.getElementById('overlay_page');
const tryButtonSocket = document.getElementById('tryButtonSocket');

let k68e09y = null;
let i68v09 = null;
try{
    // Send an authenticated POST request to your server endpoint
    const response = await fetch('6673bjshd_9900', {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
    });

    if (!response.ok) {
        throw new Error(`Error fetching key and IV: ${response.statusText}`);
    }

    const data = await response.json();
    k68e09y = data.k68e09y;
    i68v09 = data.i68v09;

} catch (error) {
    console.error('Error:', error);
}

let retryCount = 0; // Initialize retry counter
const maxRetries = 5; // Maximum retries
const retryDelay = 2000; // Retry delay in milliseconds

// Function to attempt WebSocket connection
function connectWebSocket() {
    tryButtonSocket.disabled = true;
    lunchAppStat = "yes";

    wsClient = new WebSocket('ws://localhost:8080');

    // On connection open
    wsClient.addEventListener('open', () => {
        console.log('Connected to WebSocket server.');
        retryCount = 0; // Reset retry count on success

        if (k68e09y != null && i68v09 != null) {
            const message_reload = JSON.stringify({
                type: 'reload-game',
                k68e09y: k68e09y,
                i68v09: i68v09,
                type_main: GameStatusPage
            });
            wsClient.send(message_reload);

            // Remove the overlay and re-enable the page
            overlaySocket.style.display = 'none';
            document.body.classList.remove('disabled');
        }

        // Listen for messages
        wsClient.addEventListener('message', (message) => {
            const decodedMessage = JSON.parse(message.data); // Parse the incoming message
            if (decodedMessage.type === 'main-game-ready') {
                $('.loader').hide();
            }
        });
    });

    // On connection close
    wsClient.addEventListener('close', async() => {
        if(lunchAppStat == "no") {
            await launchCustomProtocol();
        };
        console.warn('Disconnected from WebSocket server.');
        handleConnectionFailure();
        attemptReconnect();
    });

    // On error
    wsClient.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        handleConnectionFailure();
        attemptReconnect();
    });
}

// Function to handle connection failure
function handleConnectionFailure() {
    // Show the overlay and disable page interaction
    overlaySocket.style.display = 'flex';

    // Enable the "Try to Connect" button
    tryButtonSocket.disabled = false;

    // Pause game if game console disconnected
    if (drawnNumbers.length > 0) {
        isPaused = true; // Set the paused flag to true
        clearInterval(drawInterval); // Clear the interval to stop drawing

        // Send data to game console to pause the game
        try {
            wsClient.send('pause-game');
        } catch (error) {
            console.warn('Unable to send pause-game message:', error);
        }

        $(".btn-play").empty();
        $(".btn-play").append('<i class="fas fa-play-circle"></i> Resume Game');
        $('.btn-play').removeClass('dnone');
        $('.drawing-text').text('Paused');
    }
}

// Function to attempt reconnection with retries
function attemptReconnect() {
    if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying connection... (${retryCount}/${maxRetries})`);
        setTimeout(() => {
            connectWebSocket();
        }, retryDelay);
    } else {
        console.error('Max retries reached. Failed to connect to WebSocket server.');
        overlaySocket.style.display = 'flex'; // Show overlay indicating failure
    }
}

// Initial connection attempt
connectWebSocket();


// Attach the "Try to Connect" button event
tryButtonSocket.addEventListener('click', () => {
    if(drawnNumbers.length > 0){
        location.reload();
    }else{
        connectWebSocket();
    }
});

//---------------------end connect web client with game console------------------------//

// data from branch

var loader = $('.loader');
var loaderBg = $('.loaderBg');

//get shop data

function waitForEvent(target, eventName) {
    return new Promise((resolve) => {
        target.addEventListener(eventName, resolve, { once: true });
    });
}
(async () => {
    let shop_id = null;
    
    await waitForEvent(window, 'loginUserReady');
    shop_id = window.login_user.shop_id;

    const shopDocRef = doc(db, 'shop/'+shop_id);
    const shopDoc = await getDoc(shopDocRef);

    if (shopDoc.exists()) {
        const shopData = shopDoc.data();

        // Prepare shop data
        const shopDataArray = [{
            total_cartela: shopData.number_cartela,
            shop_id: shop_id,
            cashier_id: "CH1", // You can replace this with a dynamic cashier ID
            game_stake: shopData.game_stake,
            winner_per_game: shopData.winner_per_game,
            bingo_pattern: shopData.bingo_pattern,
            draw_number_code: shopData.company_code+shopData.draw_number_session,
            company_code: shopData.company_code,
            draw_number_session: shopData.draw_number_session,
            game_language: shopData.game_language,
            game_speed: shopData.game_speed,
            balance: shopData.balance,
            balance_check: shopData.balance_check || 0,
            commission_percentage: (100 - parseInt(shopData.commission_percentage)) / 100,
            shop_commission: shopData.commission_percentage,

            belongs_id: shopData.belongs_id,
            belongs_to: shopData.belongs_to,
            company_id: shopData.company_id,


            // Player minimums
            min_player1: shopData.min_player1,
            min_player2: shopData.min_player2,
            min_player3: shopData.min_player3,
            min_player4: shopData.min_player4,

            // Player maximums
            max_player1: shopData.max_player1,
            max_player2: shopData.max_player2,
            max_player3: shopData.max_player3,

            // Commission percentages
            commission_percent1: shopData.commission_percent1,
            commission_percent2: shopData.commission_percent2,
            commission_percent3: shopData.commission_percent3,
            commission_percent4: shopData.commission_percent4
        }];

        // Store data in localStorage
        localStorage.setItem('shop_data', JSON.stringify(shopDataArray));

    } else {
        console.error("Shop data not found.");
        //signOutUserInner();
    }

    const shopData = JSON.parse(localStorage.getItem('shop_data'));

    const totalCartelas = shopData[0].total_cartela
    const shopID = shopData[0].shop_id;
    const cashierID = shopData[0].cashier_id;
    let winnerPerGame = shopData[0].winner_per_game;
    let bingoPattern = shopData[0].bingo_pattern;

    let shopBalance = shopData[0].balance;
    let balance_check = shopData[0].balance_check
    //check shop balance 5 game after 0 is allowed
    if(parseInt(shopBalance) <= 0 && parseInt(balance_check) >= 5){
        const lowBalanceModal = new bootstrap.Modal(document.getElementById('lowBalanceModal'), {
            backdrop: 'static',
            keyboard: false,
        });
        lowBalanceModal.show();
    }else{
        //return balance check to 0 if balance is postive
        await updateDoc(doc(db, 'shop/'+shopID), {
            balance_check: 0
        });
    }

    let commission_percentage = shopData[0].commission_percentage;
    let shop_commission = shopData[0].shop_commission;

    $('.shopBalance, #balanceAmount').text(shopBalance+' Birr');

    const company_code = shopData[0].company_code;
    let draw_number_session = shopData[0].draw_number_session;
    let draw_number_code = shopData[0].draw_number_code;
    $('#draw_number').text(draw_number_code);

    let gameCommission = 0;
    let gameCommissionPercent = 0;

    let GameStake = shopData[0].game_stake;
    let GameLanguage = shopData[0].game_language;
    let GameSpeed = shopData[0].game_speed;

    let shopBelongsID = shopData[0].belongs_id;
    let shopBelongsTo = shopData[0].belongs_to;
    let companyID = shopData[0].company_id;

    //get company and agent commission
    let company_commission = 0;
    let agent_commission = 0;
    if(shopBelongsTo == "agent"){
        
        const agentDocRef = doc(db, 'agent/'+shopBelongsID);
        const agentDoc = await getDoc(agentDocRef);
        const agentData = agentDoc.data();
        agent_commission = agentData.commission_percentage;
    }
    const companyDocRef = doc(db, 'company/'+shopBelongsID);
    const companyDoc = await getDoc(companyDocRef);
    const companyData = companyDoc.data();
    company_commission = companyData.commission_percentage;

    $('#GameStake').text(`${GameStake}.00`);
    $('.game_stake_st').text(GameStake+' Birr');
    $('.game_language_st').text(GameLanguage);

    $('.winner_per_game_st').text(`
        ${
            winnerPerGame == 1 ? "1 Person" : 
            winnerPerGame == 2 ? "2 Person" : 
            winnerPerGame == 3 ? "3 Person" : "Unknown"
         }
    `);
    $('.bingo_patter_win_st').text(`
         ${
            bingoPattern == 1 ? "1 Line" : 
            bingoPattern == 2 ? "2 Line" : 
            bingoPattern == 3 ? "3 Line" :
            bingoPattern == 4 ? "4 Line" :
            bingoPattern == 5 ? "Full House" : "Unknown"
         }
    `);

    $('.game_speed_st').text(`
        ${
            GameSpeed == 3000 ? "High" : 
            GameSpeed == 5000 ? "Medium" : 
            GameSpeed == 7000 ? "Slow" : "Unknown"
        }
    `);

    //game commission
    const min_player1 = parseInt(shopData[0].min_player1) || 0;
    const min_player2 = parseInt(shopData[0].min_player2) || 0;
    const min_player3 = parseInt(shopData[0].min_player3) || 0;
    const min_player4 = parseInt(shopData[0].min_player4) || 0;

    const max_player1 = parseInt(shopData[0].max_player1) || 0;
    const max_player2 = parseInt(shopData[0].max_player2) || 0;
    const max_player3 = parseInt(shopData[0].max_player3) || 0;

    const commission_percent1 = parseInt(shopData[0].commission_percent1) || 0;
    const commission_percent2 = parseInt(shopData[0].commission_percent2) || 0;
    const commission_percent3 = parseInt(shopData[0].commission_percent3) || 0;
    const commission_percent4 = parseInt(shopData[0].commission_percent4) || 0;

    let selectedCartelas = [];
    let rowReferences = {};


     //update data if any unfinished data exist cus of network problem
     const storedUData = JSON.parse(localStorage.getItem('b09c60k12p'));
     if (storedUData) {
         batchGameEnd1 = writeBatch(db);//add new batch check
         const { docBackup1_update, docBackup2_update, docBackup3_update } = storedUData;

         try{
            const shopRefi = doc(db, 'shop/'+shopID);
            //update first data db
            batchGameEnd1.update(shopRefi, {
                balance: docBackup1_update[0].balance,
                balance_check: docBackup1_update[0].balance_check,
                draw_number_session: docBackup1_update[0].draw_number_session
            });

            //update second data db
            const SessionCollection = collection(db, 'game_session/'+docBackup3_update[0].formattedDate+'/list');
            const docRefi = doc(SessionCollection, docBackup2_update[0].cartelaSessionId);
            batchGameEnd1.update(docRefi, {
                winningcartelas: docBackup2_update[0].winningcartelas,
                bingo_pattern_used: docBackup2_update[0].bingo_pattern_used,
            });
        
            //update third data db
            const docRef2 = doc(collection(db, `report/${docBackup3_update[0].formattedDate}/general`), shopID);
            const docSnap = await getDoc(docRef2);

            let report_commission_amount = docBackup3_update[0].commission_amount;
            let report_total_payin = docBackup3_update[0].total_payin;
            let report_total_payout = docBackup3_update[0].total_payout;
            let report_total_ticket = docBackup3_update[0].total_ticket;
            let report_total_player = docBackup3_update[0].total_player;
            let report_game_completed = docBackup3_update[0].game_completed;

            let report_game_not_completed = docBackup3_update[0].game_not_completed;
            let report_total_amount_refund = docBackup3_update[0].total_amount_refund;
            let report_commission_percent = docBackup3_update[0].commission_percent

    
            if(docSnap.exists()){
                const data = docSnap.data();
                report_game_not_completed = parseFloat(data.game_not_completed || 0)-parseFloat(docBackup3_update[0].game_not_completed);
                report_total_amount_refund = parseFloat(data.total_amount_refund || 0)-parseFloat(docBackup3_update[0].total_amount_refund);
    
                report_game_completed = parseFloat(data.game_completed || 0)+parseFloat(docBackup3_update[0].game_completed);
    
                report_commission_amount = parseFloat(data.commission_amount || 0)+parseFloat(docBackup3_update[0].commission_amount);
                report_total_payin = parseFloat(data.total_payin || 0)+parseFloat(docBackup3_update[0].total_payin);
                report_total_payout = parseFloat(data.total_payout || 0)+parseFloat(docBackup3_update[0].total_payout);
                report_total_ticket = parseFloat(data.total_ticket || 0)+parseFloat(docBackup3_update[0].total_ticket);
                report_total_player = parseFloat(data.total_player || 0)+parseFloat(docBackup3_update[0].total_player);
            }
    
            batchGameEnd1.update(docRef2, {
                commission_amount: report_commission_amount,
                total_payin: report_total_payin,
                total_payout: report_total_payout,
                total_ticket: report_total_ticket,
                total_player: report_total_player,
                game_completed: report_game_completed,
                game_not_completed: report_game_not_completed,
                total_amount_refund: report_total_amount_refund,
                commission_percent: arrayUnion(report_commission_percent),
    
                belongs_to: docBackup3_update[0].belongs_to,//company
                belongs_id: docBackup3_update[0].belongs_id,//C5365111224
                company_id: docBackup3_update[0].company_id,
                shop_commission: docBackup3_update[0].shop_commission,
                company_commission: docBackup3_update[0].company_commission,
                agent_commission: docBackup3_update[0].agent_commission,
            });
    
            await batchGameEnd1.commit().then(() => {
                localStorage.removeItem('b09c60k12p');
                console.log('Batch operation successful!');
            });

        }catch (error) {
            console.error(error);
        }
    }


    const selectedCartelaTable = $('#selectedCartelaTable').DataTable({
        paging: true,
        searching: true,
        info: false,
        lengthChange: false,
        ordering: false,
        pageLength: 8, // Limit to 6 rows per page
        language: {
            search: "", // Removes default label text for search
            searchPlaceholder: "Search Player..." // Custom placeholder text
        },
        dom: '<"dataTables_filter"f>t<"dataTables_pagination"p>',
    });

    localStorage.removeItem('cartelas');//remove cartelas on page load
    localStorage.removeItem('drawnNumbers');//remove drawnNumbers on page load



    // -----------------------load cartelas----------------------------
    fetchCartelaData();
    async function fetchCartelaData() {
        const cartelaCollection = collection(db, `shop_data/cartela/${shopID}`);
        
        // Get current timestamp and the saved timestamp
        const now = Date.now();
        const storedTimestamp = localStorage.getItem('cartelaTimestamp');
        const storedCartelaData = JSON.parse(localStorage.getItem('cartelaData'));

        // Check if localStorage data is valid (within 24 hours and matches totalCartelas)
        const isDataValid = storedCartelaData && 
                            storedTimestamp && 
                            (now - storedTimestamp < 24 * 60 * 60 * 1000) &&
                            (storedCartelaData.length == totalCartelas);

        if (isDataValid) {
            //console.log('Loaded data from localStorage:', storedCartelaData);
            displayCartelaData(storedCartelaData);
            return;
        }
        
        // If data is expired, missing, or the count is incorrect, fetch from Firestore
        try {
            const cartelaQuery = query(
                cartelaCollection, 
                orderBy("cartela_id", "asc"), // Sort by cartela_id in descending order
                limit(totalCartelas)          // Apply the limit
            );
            const querySnapshot = await getDocs(cartelaQuery);
            const cartelaData = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
            
            // Store new data and timestamp in localStorage
            localStorage.setItem('cartelaData', JSON.stringify(cartelaData));
            localStorage.setItem('cartelaTimestamp', now);
            //console.log('Fetched data from Firestore and stored in localStorage:', cartelaData);

            // Display the fresh data on the page
            displayCartelaData(cartelaData);
        } catch (error) {
            console.error("Error fetching cartelas:", error);
        }
    }

    function displayCartelaData(cartelaData) {
        const $cartelaList = $('#cartelaList');
        $cartelaList.empty();
        cartelaData.forEach(item => {
            const cartelaId = item.cartela_id;
            $cartelaList.append(`
                <div class="col cartela-item" data-cartela-id="${cartelaId}">
                    <div class="card cartela-card text-center" data-cartela-count="0">
                        <h5>${cartelaId}</h5>
                        <span class="cartela_type"></span>
                        <span class="cashier_type"></span>
                    </div>
                </div>
            `);
        });
        loaderBg.hide();
    }
    //----------------------------End Load cartela-------------------------------




    //------------------cartela click function---------------------
    let cartelaSession = 0;
    let cartelaSessionId = "";
    let gameSessionCollection = collection(db, 'game_session/'+getDatem(new Date())+'/list');
    let shopRef = doc(db, 'shop/'+shopID);

    $(document).on('click', '.cartela-card', async function () {
        const cartelaId = $(this).closest('.cartela-item').data('cartela-id');
        const cartelaType = $(this).find('.cartela_type').text();

        //select cartela div
        if (!selectedCartelas.includes(cartelaId) && cartelaSession == 0) {
            $('#clearCartela').show();//show clear cartela button

            //send data to game console
            const message_send = JSON.stringify({ 
                type: 'cartela-select', 
                cartela: cartelaId,
            });
            wsClient.send(message_send);

            selectedCartelas.push(cartelaId);
            // Add row to DataTable and store reference
            const row = selectedCartelaTable.row.add([
                'T'+generateID(),
                cartelaId,
                `Cartela`
            ]).draw().node();
            rowReferences[cartelaId] = row;

            // add cartela to Firestore
            cartelaSessionId = 'SI'+generateID();
            const docRef = doc(gameSessionCollection, cartelaSessionId);
            try {
                setDoc(docRef, {
                    id: cartelaSessionId,
                    shopID: shopID,
                    belongs_id: shopBelongsID,
                    belongs_to: shopBelongsTo,
                    company_id: companyID,
                    company_commission: company_commission,
                    agent_commission: agent_commission,
                    cartelas: [{
                        cartelaId: cartelaId,
                        cartelaType: "cartela",
                        cashierID: cashierID,
                        status: "active"
                    }],
                    bingo_pattern_used: bingoPattern,
                    winningcartelas: [],
                    drawnNumbers: [],
                    startTime: "",
                    accounting:{
                        stake: parseFloat(GameStake),
                        commission: stakeCommission(),
                        commission_percent: gameCommissionPercent,
                        total_stake: parseFloat($('#totalStake').text()),
                        payout: parseFloat($('#payout').text()),
                        total_player: parseFloat($('#totalPlayer').text()),
                    },
                    shop_commission: shop_commission,
                    company_commission: company_commission,
                    agent_commission: agent_commission,
                    endTime: "",
                    user: cashierID,
                    date_create: Timestamp.now(),
                });
            } catch (error) {
                alert("Error while adding!");
                console.error("Error adding cartela:", error);
            }
            $(this).attr('data-cartela-count', 1);
            $(this).addClass('active1');
            $(this).find('.cartela_type').text('cartela');
            $(this).find('.cashier_type').text(cashierID);
            
            cartelaSession = 1;
            //add data to localstorage for later use update
            let cartelas = JSON.parse(localStorage.getItem('cartelas')) || [];
            cartelas.push({
                cartelaId: cartelaId,
                cartelaType: "cartela",
                cashierID: cashierID,
                status: "active"
            });
            localStorage.setItem('cartelas', JSON.stringify(cartelas));
        } else {
            if($(this).attr('data-cartela-count') == 0){

                //send data to game console
                const message_send = JSON.stringify({ 
                    type: 'cartela-select', 
                    cartela: cartelaId,
                });
                wsClient.send(message_send);
                
                selectedCartelas.push(cartelaId);
                // Add row to DataTable and store reference
                const row = selectedCartelaTable.row.add([
                    'T'+generateID(),
                    cartelaId,
                    `Cartela`
                ]).draw().node();
                rowReferences[cartelaId] = row;

                $(this).attr('data-cartela-count', 1);
                $(this).addClass('active1');
                $(this).find('.cartela_type').text('cartela');
                $(this).find('.cashier_type').text(cashierID);

                //update localstorage for updating firestore
                updateCartelaInLocalStorage(cartelaId, "cartela")
                //update the existing data in db while cartela selected
                const docRef = doc(gameSessionCollection, cartelaSessionId);
                const updatedcartelas = JSON.parse(localStorage.getItem('cartelas')) || [];
                try {
                    updateDoc(docRef, {
                        cartelas: updatedcartelas,
                        accounting:{
                            stake: parseFloat(GameStake),
                            commission: stakeCommission(),
                            commission_percent: gameCommissionPercent,
                            total_stake: parseFloat($('#totalStake').text()),
                            payout: parseFloat($('#payout').text()),
                            total_player: parseFloat($('#totalPlayer').text()),
                        }
                    });
                } catch (error) {
                    alert("Error while adding!");
                    console.error("Error updating cartelas:", error);
                }
            }
            else if($(this).attr('data-cartela-count') == 1){
                $(this).attr('data-cartela-count', 2);
                $(this).removeClass('active1');
                $(this).addClass('active2');
                $(this).find('.cartela_type').text('print');
                $(this).find('.cashier_type').text(cashierID);
                
                updateCartelaInLocalStorage(cartelaId, "print")
                //update table
                selectedCartelaTable.cell(rowReferences[cartelaId], 2).data(`
                    Print <button class="btn btn-primary btn-sm print-btn" title="print" data-cartela="${cartelaId}"><i class="fas fa-print"></i></button>
                `).draw();
                //update the existing data in db while cartela selected
                const docRef = doc(gameSessionCollection, cartelaSessionId);
                const updatedcartelas = JSON.parse(localStorage.getItem('cartelas')) || [];
                try {
                    updateDoc(docRef, {
                        cartelas: updatedcartelas
                    });
                } catch (error) {
                    alert("Error while adding!");
                    console.error("Error updating cartelas:", error);
                }
            }else{
                Swal.fire({
                    title: "Deselect this Cartela?",
                    html: `
                        <div class="row row-cols-6 justify-content-center">
                            <div class="col cartela-item" style="width: 110px;">
                                <div class="card cartela-card text-center active2">
                                    <h5>${cartelaId}</h5>
                                </div>
                            </div>
                        </div>
                    `, // Custom div with icon
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No'
                }).then(async(result) => {
                    if (result.isConfirmed) {
                        
                        //send data to game console
                        const message_send = JSON.stringify({ 
                            type: 'cartela-deselect', 
                            cartela: cartelaId,
                        });
                        wsClient.send(message_send);

                        $(this).attr('data-cartela-count', 0);
                        $(this).removeClass('active2');
                        $(this).find('.cartela_type').text('');
                        $(this).find('.cashier_type').text('');

                        selectedCartelas = selectedCartelas.filter(id => id !== cartelaId);

                        // Remove the row from DataTable and update
                        selectedCartelaTable.row(rowReferences[cartelaId]).remove().draw();
                        delete rowReferences[cartelaId];

                        // Function to remove a specific cartelaId from db
                        removeCartelaFromLocalStorage(cartelaId)
                        const docRef = doc(gameSessionCollection, cartelaSessionId);
                        const updatedcartelas = JSON.parse(localStorage.getItem('cartelas')) || [];
                        try {
                            updateDoc(docRef, {
                                cartelas: updatedcartelas// Remove the specified cartelaId
                            });
                        } catch (error) {
                            alert("Error while removing!");
                            console.error("Error removing cartela:", error);
                        }

                        // Hide clear button if no cartelas are selected
                        if (Object.keys(rowReferences).length === 0) {
                            $('#clearCartela').hide();
                        }
                        // Hide play game button if less than 2 cartela selected
                        if (Object.keys(rowReferences).length === 1) {
                            $("#startGame").addClass('disabled_div');
                        }

                        updateTotalStake();//update game info
                    }
                });
            }//else
        }
        updateTotalStake();//update game info
        //check and enable/disable play game button
        if(selectedCartelaTable.rows({ filter: 'applied' }).count() > 1){
            $('.start-game-btn').removeClass('disabled_div');
            $('#startGame').prop('disabled', false);
        }else{
            $('.start-game-btn').addClass('disabled_div');
        }
    });

    //update cartela in localstorge for usage of updating firestore
    function updateCartelaInLocalStorage(cartelaId, newCartelaType) {
        let cartelas;

        // Attempt to parse cartelas from localStorage and default to an empty array if there's an issue
        try {
            cartelas = JSON.parse(localStorage.getItem('cartelas')) || [];
        } catch (error) {
            console.error("Error parsing cartelas from localStorage:", error);
            cartelas = []; // Default to an empty array if parsing fails
        }

        // Check if cartelas is an array; if not, reset to an empty array
        if (!Array.isArray(cartelas)) {
            cartelas = [];
        }

        // Find the index of the cartela with the given ID
        const index = cartelas.findIndex(cartel => cartel.cartelaId === cartelaId);

        if (index !== -1) {
            // If cartela already exists, update its type
            cartelas[index].cartelaType = newCartelaType;
        } else {
            // If not found, add the new cartela
            cartelas.push({ 
                cartelaId, 
                cartelaType: newCartelaType, 
                cashierID: cashierID,
                status: "active"
            });
        }

        // Save the updated cartelas array back to localStorage
        localStorage.setItem('cartelas', JSON.stringify(cartelas));
    }
    //update cartela in localstorge for usage of updating firestore
    function removeCartelaFromLocalStorage(cartelaId) {
        // Retrieve the cartelas array from localStorage
        let cartelas = JSON.parse(localStorage.getItem('cartelas')) || [];

        // Filter out the cartela to be removed
        cartelas = cartelas.filter(cartel => cartel.cartelaId !== cartelaId);

        // Save the updated array back to localStorage
        localStorage.setItem('cartelas', JSON.stringify(cartelas));
    }



    //-----------print cartela card--------------
    $(document).on('click', '.print-btn', function () {
        const cartelaId = $(this).data('cartela');

        // Retrieve cartela data from localStorage
        const storedCartelaData = JSON.parse(localStorage.getItem('cartelaData'));

        // Find the specific cartela by cartelaId
        const cartelaData = storedCartelaData.find(data => data.cartela_id === cartelaId);

        if (!cartelaData) {
            console.error("Cartela data not found for printing.");
            return;
        }

        // Prepare Bingo table structure
        const bingoHeader = `
            <thead>
                <tr>
                    <th>B</th>
                    <th>I</th>
                    <th>N</th>
                    <th>G</th>
                    <th>O</th>
                </tr>
            </thead>
        `;

        // Prepare rows for the Bingo numbers
        const maxRows = Math.max(cartelaData.cartela.B.length, cartelaData.cartela.I.length, cartelaData.cartela.N.length, cartelaData.cartela.G.length, cartelaData.cartela.O.length);
        const bingoRows = [];
        
        for (let i = 0; i < maxRows; i++) {
            bingoRows.push('<tr>');
            bingoRows.push(`<td>${cartelaData.cartela.B[i] !== undefined ? cartelaData.cartela.B[i] : ''}</td>`);
            bingoRows.push(`<td>${cartelaData.cartela.I[i] !== undefined ? cartelaData.cartela.I[i] : ''}</td>`);
            bingoRows.push(`<td>${cartelaData.cartela.N[i] !== undefined ? cartelaData.cartela.N[i] : ''}</td>`);
            bingoRows.push(`<td>${cartelaData.cartela.G[i] !== undefined ? cartelaData.cartela.G[i] : ''}</td>`);
            bingoRows.push(`<td>${cartelaData.cartela.O[i] !== undefined ? cartelaData.cartela.O[i] : ''}</td>`);
            bingoRows.push('</tr>');
        }

        // Combine header and rows into one table content
        const tableContent = `
            <h5 style="text-align: right;">Game ID: ${cartelaData.id}</h5>
            <h5 style="text-align: right;">${shopID}-${cashierID}</h5>
            <h5 style="text-align: right;">Cartela: ${cartelaId}</h5>
            <table border="1" style="width: 100%; text-align: center; border-collapse: collapse;">
                ${bingoHeader}
                <tbody>
                    ${bingoRows.join('')}
                </tbody>
            </table>
        `;

        // Open print window
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Cartela</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        h2 { text-align: center; }
                        table { margin: 20px auto; }
                        th, td { padding: 8px; }
                    </style>
                </head>
                <body>${tableContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    });



    //--------update total stake and other information-------
    function updateTotalStake() {
        const stakeValue = parseFloat(GameStake) || 0;
        const totalStake = stakeValue * selectedCartelas.length;
        $('#totalStake').text(`${totalStake.toFixed(2)}`);

        const stake_commission = stakeCommission();
        const payout = totalStake - stake_commission;
        // Update the payout element
        $('#payout').text(`${parseInt(payout)}`);
        
        const player = selectedCartelaTable.rows().count();
        $('#totalPlayer').text(`${player}`);
    }

    //---------------search cartela-----------------
    $('#searchCartela').on('input', function () {
        const searchTerm = $(this).val();
        $('.cartela-item').each(function () {
            const cartelaNumber = $(this).data('cartela-id').toString();
            $(this).toggle(cartelaNumber.includes(searchTerm));
        });
        $('#clearSearch').toggle(!!searchTerm);
    });

    $('#clearSearch').on('click', function () {
        $('#searchCartela').val('').trigger('input');
    });

    // Add search and clear icons
    const dataTableSearchInput = $('#selectedCartelaTable_filter input');
    dataTableSearchInput
        .attr('placeholder', 'Search...')
        .wrap('<div class="position-relative"></div>')
        .before('<i class="fas fa-search position-absolute" style="left: 10px; top: 50%; transform: translateY(-50%); color: #888; font-size: 15px;"></i>');

    // Clear search when clicking on the cancel icon
    $('.clear-search-icon').click(function () {
        dataTableSearchInput.val('').trigger('keyup'); // Clear input and trigger search
    });

    //-------------clear all selected cartela--------------
    $('#clearCartela').click(function() {
        Swal.fire({
            title: "Are you sure you want to clear all selected cartela?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: 'Yes, clear it!',
            cancelButtonText: 'No, keep it!'
        }).then((result) => {
            if (result.isConfirmed) {
                selectedCartelaTable.clear().draw();
                $('.cartela-card').removeClass('active1');
                $('.cartela-card').removeClass('active2');
                $('.cartela_type').text('');
                $('.cashier_type').text('');
                $('.cartela-card').attr('data-cartela-count', 0);
                //empty and add bingo div
                $('.bingo-row').empty();
                add_bingo_div();
                $('.ball').remove();
                
                rowReferences = {};
                $('#clearCartela').hide();
                $(".game_info span").text("0.00");
                $('#GameStake').text(`${GameStake}.00`);

                localStorage.removeItem('cartelas');//remove cartelas local storage
                localStorage.removeItem('drawnNumbers');//remove drawnNumbers local storage

                const docRef = doc(gameSessionCollection, cartelaSessionId);
                try {
                    deleteDoc(docRef); // Delete the document
                    cartelaSession = 0;
                    $("#startGame").addClass('disabled_div');//disable start game button
                } catch (error) {
                    alert('Error while removing');
                    console.error("Error deleting document:", error);
                }

                cartelaSession = 0;
                selectedCartelas = [];
                drawnNumbers = [];
                drawInterval = null; // Reset it
            }
        });
    });







    //---------------------------main play game function--------------------------------

    $('#startGame, .restart_game').on('click', function () {

        Swal.fire({
            title: "Do you want to start the Game?",
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then(async(result) => {
            if (result.isConfirmed) {

                $('.loader').show();
                $('.btn-check-winner').prop('disabled', true);
                //hide and show button
                $('#checkWinner').removeClass('dnone');
                $('.restart_game').addClass('dnone');

                $('.cartela_selection_div').addClass('disabled_div');

                const docRef = doc(gameSessionCollection, cartelaSessionId);
                const docSnap = await getDoc(docRef);

                //update game Data
                try {
                    if(docSnap.exists()){
                        updateDoc(docRef, {
                            startTime: Timestamp.now(),
                            accounting:{
                                stake: parseFloat(GameStake),
                                commission: stakeCommission(),
                                commission_percent: gameCommissionPercent,
                                total_stake: parseFloat($('#totalStake').text()),
                                payout: parseFloat($('#payout').text()),
                                total_player: parseFloat($('#totalPlayer').text()),
                            }
                        });
                    }else{
                        const cartelas = JSON.parse(localStorage.getItem('cartelas'));
                        setDoc(docRef, {
                            id: cartelaSessionId,
                            shopID: shopID,
                            belongs_id: shopBelongsID,
                            belongs_to: shopBelongsTo,
                            company_id: companyID,
                            company_commission: company_commission,
                            agent_commission: agent_commission,
                            cartelas: cartelas,
                            bingo_pattern_used: bingoPattern,
                            winningcartelas: [],
                            drawnNumbers: [],
                            startTime: "",
                            accounting:{
                                stake: parseFloat(GameStake),
                                commission: stakeCommission(),
                                commission_percent: gameCommissionPercent,
                                total_stake: parseFloat($('#totalStake').text()),
                                payout: parseFloat($('#payout').text()),
                                total_player: parseFloat($('#totalPlayer').text()),
                            },
                            shop_commission: shop_commission,
                            company_commission: company_commission,
                            agent_commission: agent_commission,
                            endTime: "",
                            user: cashierID
                        });
                    }
                } catch (error) {
                    $('.loader').hide();
                    alert("Error while adding!");
                    throw new Error('Error while adding!');
                }
                
                //update report
                add_report('not-completed');
                gameCommission = stakeCommission();


                // Display cashier game play
                $('.game_play_cashier').css('display', 'block'); // Show the div
                setTimeout(function() {
                    $('.game_play_cashier').addClass('show-slide-down');

                }, 50); // Delay to allow for transition effect

                // Display game start countdown
                $('#countdownModal').modal('show'); // Show the countdown modal
                startCountdown(); // Start the countdown

                // Disable the start button to prevent restarting while the game is in progress
                $('#startGame').prop('disabled', true);

                if (wsClient.readyState === WebSocket.OPEN) {
                    //send data to game console to start game
                    const message_start = JSON.stringify({ 
                        type: 'start-game', 
                        payout: parseInt($('#payout').text()),
                        draw_number_code: draw_number_code,
                        game_speed: GameSpeed,
                        game_language: GameLanguage,
                        bingoPattern:  `
                         ${
                            bingoPattern == 1 ? "1 Line" : 
                            bingoPattern == 2 ? "2 Line" : 
                            bingoPattern == 3 ? "3 Line" :
                            bingoPattern == 4 ? "4 Line" :
                            bingoPattern == 5 ? "Full House" : "Unknown"
                         }
                        `
                    });
                    wsClient.send(message_start);

                    //wait the draw animation ends loading then draw
                    wsClient.addEventListener('message', (message) => {
                        const decodedMessage = JSON.parse(message.data); // Parse the incoming message

                        if (decodedMessage.type === 'animation-ready') {
                            drawNumber(); // Draw the first number

                            // Set an interval for subsequent draws
                            drawInterval = setInterval(drawNumber, GameSpeed);
                        }
                    });
                }
                $('.loader').hide();

            }//if
        });
    });

    function drawNumber() {
        if (drawnNumbers.length >= 75) {
            clearInterval(drawInterval); // Stop the interval when all numbers are drawn

            //send data to game console to pause the game
            wsClient.send('game-over');

            Swal.fire({
                title: 'Game Over!',
                text: 'All numbers have been drawn. Game over!',
                icon: 'info',
                timer: 2000,
                showConfirmButton: false
            });
            restart_game_more_winner();
            return;
        }

        if (isPaused) return; // Skip drawing if the game is paused

        // Generate a unique random number
        let randomNumber;
        do {
            randomNumber = Math.floor(Math.random() * 75) + 1;
        } while (drawnNumbers.includes(randomNumber)); // Ensure the number is unique

        // Add the unique number to drawnNumbers array
        drawnNumbers.push(randomNumber);
        //enable cehck winner button if 45 and above raw exist
        if(drawnNumbers.length >= 5){
            $('.btn-check-winner').prop('disabled', false);
        }

        // Mark the drawn number on the board and check for wins
        markNumber(randomNumber);

        // Send draw number to the game console
        if (wsClient.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type: 'drawnNumber', number: randomNumber });
            wsClient.send(message);
        }
    }

    // Game start Countdown timer function
    function startCountdown() {
        let countdownValue = 25; // Set initial countdown value
        $('#countdownTimer').text(countdownValue); // Set the initial display

        // Update the countdown every second
        const countdownInterval = setInterval(function() {
            countdownValue--;
            $('#countdownTimer').text(countdownValue);

            // When countdown reaches 0, stop and hide modal, show game content
            if (countdownValue <= 0) {
                clearInterval(countdownInterval);

                $('#countdownModal').modal('hide'); // Hide the modal
                $('#gamePlayCashier').fadeIn(); // Show the game content
            }
        }, 1000);
    }
    //restore body scroll behavior when modal closed
    $('#countdownModal').on('hidden.bs.modal', function () {
        $('body').removeClass('modal-open').css({
            overflow: '',
            paddingRight: ''
        });
    });
    $('#countdownModal').modal({
        backdrop: 'static', // Prevent closing when clicking outside
        keyboard: false     // Prevent closing with the Escape key
    });

    // Function to mark the number on the board
    async function markNumber(number) {
        let newBall = "";

        // change the size of the last ball before new one added
        $('.ball').eq(0).removeClass('ball1').addClass('ball2');
        $('.ball').eq(1).removeClass('ball2').addClass('ball3');

        // Define color based on number range and create new ball element
        if (number > 0 && number <= 15) {
            $('.bingo-item-' + number).css('background-color', '#34b2fe');
            newBall = $('<div class="ball ball1 text-white d-flex align-items-center justify-content-center mx-2" style="background-color: #34b2fe;"></div>').text(number);
        } else if (number > 15 && number <= 30) {
            $('.bingo-item-' + number).css('background-color', '#e2ff00');
            newBall = $('<div class="ball ball1 text-white d-flex align-items-center justify-content-center mx-2" style="background-color: #e2ff00;"></div>').text(number);
        } else if (number > 30 && number <= 45) {
            $('.bingo-item-' + number).css('background-color', '#ea00f5');
            newBall = $('<div class="ball ball1 text-white d-flex align-items-center justify-content-center mx-2" style="background-color: #ea00f5;"></div>').text(number);
        } else if (number > 45 && number <= 60) {
            $('.bingo-item-' + number).css('background-color', '#0ec02c');
            newBall = $('<div class="ball ball1 text-white d-flex align-items-center justify-content-center mx-2" style="background-color: #0ec02c;"></div>').text(number);
        } else if (number > 60 && number <= 75) {
            $('.bingo-item-' + number).css('background-color', '#fe005a');
            newBall = $('<div class="ball ball1 text-white d-flex align-items-center justify-content-center mx-2" style="background-color: #fe005a;"></div>').text(number);
        }

        // Apply popout animation to the board item
        $('.bingo-item-' + number).addClass('popout');

        // Add the new ball at the front with animation
        newBall.hide().insertAfter('.drawing-text').fadeIn(300).css('animation', 'slideIn 0.5s forwards');

        // Check if there are more than 3 balls displayed
        const ballsDisplayed = $('.ball');
        if (ballsDisplayed.length > 3) {
            var index = parseInt(ballsDisplayed.length)-1;
            ballsDisplayed.eq(index).remove();
        }

        //add draw to firestore and localStorage
        const docRef = doc(gameSessionCollection, cartelaSessionId);
        updateDoc(docRef, {
            drawnNumbers: arrayUnion(number)
        });
        const drawnNumbersm = JSON.parse(localStorage.getItem('drawnNumbers')) || [];
        drawnNumbersm.push(number);
        localStorage.setItem('drawnNumbers', JSON.stringify(drawnNumbersm));
    }


    // Pause play game functionality
    /*$('.btn-pause').on('click', function () {
        isPaused = true; // Set the paused flag to true
        clearInterval(drawInterval); // Clear the interval to stop drawing

        //send data to game console to pause the game
        wsClient.send('pause-game');

        $('.btn-pause').addClass('dnone');
        $('.btn-play').removeClass('dnone');
        $('.drawing-text').text('Paused');
    });*/

    // Continue playe Game functionality
    $('.btn-play').on('click', function () {

        $('#checkWinnerForm').removeClass('dnone');

        if (!isPaused) return; // If not paused, do nothing

        isPaused = false; // Reset the paused flag
        $('#gameStatus').html('<strong>Game Resumed</strong>'); // Update the status

        //send data to game console to resume the game
        wsClient.send('play-game');
        
        // Resume drawing with the previous interval
        var playInt = parseInt(GameSpeed)-1000;
        setTimeout(function(){
            $('#checkWinnerModal').modal('hide');
            drawInterval = setInterval(drawNumber, GameSpeed);
            $('.btn-play').addClass('dnone');
            //$('.btn-pause').removeClass('dnone');
            $('.drawing-text').text('Drawing...');
        }, playInt);//wait for second before continue drawing the next draw
    });


    //for tag input
    const tagInput = document.getElementById("tagInput");
    const tagsInputContainer = document.getElementById("tagsInputContainer");

    // Array to store tags
    let tags = [];

    //--------check winner------------
    $(document).on('keydown', function(event) {
        if (event.key === 'Enter') {
            $('#checkWinner').click();
        }
    });
    $('#checkWinner').click(function(){
        isPaused = true; // Set the paused flag to true
        clearInterval(drawInterval); // Clear the interval to stop drawing

        //send data to game console to pause the game
        wsClient.send('check-result');

        //$('.btn-pause').addClass('dnone');
        $(".btn-play").empty();
        $(".btn-play").append('<i class="fas fa-play-circle"></i> Resume Game');
        $('.btn-play').removeClass('dnone');
        $('.drawing-text').text('Paused');
        $('#checkWinnerModal').modal('toggle');
    });

    //reste input on open modal
    $('#checkWinnerModal').on('show.bs.modal', function (event) {
        $("#tagsInputContainer").removeClass("disabled_div");//disable input div
        $(".winnerDetails").addClass('dnone');

        const tagsInputContainer1 = document.getElementById("tagsInputContainer");
        const tagElements1 = tagsInputContainer1.querySelectorAll(".tag-custom");
        tagElements1.forEach(tagElement1 => {
            tagElement1.remove();
        });
        $('#tagInput').val("");
        document.getElementById("tagInput").disabled = false
        tags = [];
        
        $('.winnerDetails').empty();

        $('#checkWinnerModal .btn-primary').removeClass('dnone');
        $('#checkWinnerModal .btn-success').addClass('dnone');
    });

    //check game winner
    $('#checkWinnerForm').click(async function(){

        const tagElements = tagsInputContainer.querySelectorAll(".tag-custom");
        if(tagElements.length <= 0){
            alert('Add cartela to check');
            return;
        }

        //check winner
        var cartela_ck = JSON.parse(localStorage.getItem('cartelas')) || []
        if(cartela_ck.length > 0){
            
            let check_exist = "yes";
            const tagElements = tagsInputContainer.querySelectorAll(".tag-custom");

            for (const tagElement of tagElements) {
                let foundMatch = false; 

                for (let i = 0; i < cartela_ck.length; i++) {
                    if (tagElement.dataset.tagText == cartela_ck[i].cartelaId) {
                        foundMatch = true;
                        break;
                    }
                }
                if (!foundMatch) {
                    check_exist = "no";
                    break;
                }
            }

            //cartela exist so check winner
            if(check_exist == "yes"){
                //if tag element is grater than 2
                const tagElements = tagsInputContainer.querySelectorAll(".tag-custom");
                var cartelaDatas = JSON.parse(localStorage.getItem('cartelaData'))

                let winnerFound = false;
                let winnerCartela = [];
                let winnerCartelaCard = [];
                let disculifiedCartela = [];

                //let DrawNumber = [14, 5, 4, 75, 8, 15, 12];//use this for production - drawnNumbers

                const DrawNumberSend = drawnNumbers;
                
                for (const provided_cartela of tagElements) {
                    for (const cartelaData of cartelaDatas) {
                        if(provided_cartela.dataset.tagText == cartelaData.cartela_id){

                            function isLine(line) {
                                // Convert each element in the line to an integer using map
                                const parsedLine = line.map(num => (num === "Free" ? "Free" : parseInt(num, 10)));

                                // Perform the check on the parsed line
                                return parsedLine.every(num => num === "Free" || drawnNumbers.includes(num));
                            }

                            function is4Corner(line) {
                                // Convert each element in the line to an integer using map
                                const parsedLine = line.map(num => (num === "Free" ? "Free" : parseInt(num, 10)));

                                // Perform the check on the parsed line
                                return parsedLine.every(num => drawnNumbers.includes(num));
                            }

                            function checkForLine(cartela, bingoPattern) {
                                const lineCount = 5; // Assuming each dimension (B, I, N, G, O) has 5 elements
                                let validLineCount = 0; // Count of valid lines

                                // Check rows
                                for (let i = 0; i < lineCount; i++) {
                                    let row = [
                                        cartela.B[i],
                                        cartela.I[i],
                                        cartela.N[i],
                                        cartela.G[i],
                                        cartela.O[i]
                                    ];
                                    if (isLine(row)) {
                                        validLineCount++;
                                        if (validLineCount >= bingoPattern) return true; // Return early if condition is met
                                    }
                                }

                                // Check columns
                                const col_ck = ["B", "I", "N", "G", "O"]; // Define the keys for each column
                                for (let j = 0; j < col_ck.length; j++) {
                                    let column = [];
                                    for (let i = 0; i < lineCount; i++) {
                                        column.push(cartela[col_ck[j]][i]);
                                    }
                                    if (isLine(column)) {
                                        validLineCount++;
                                        if (validLineCount >= bingoPattern) return true; // Return early if condition is met
                                    }
                                }

                                // Check diagonals
                                let diagonal1 = [
                                    cartela.B[0],
                                    cartela.I[1],
                                    cartela.N[2],
                                    cartela.G[3],
                                    cartela.O[4]
                                ];
                                let diagonal2 = [
                                    cartela.B[4],
                                    cartela.I[3],
                                    cartela.N[2],
                                    cartela.G[1],
                                    cartela.O[0]
                                ];

                                if (isLine(diagonal1)) {
                                    validLineCount++;
                                    if (validLineCount >= bingoPattern) return true; // Return early if condition is met
                                }
                                if (isLine(diagonal2)) {
                                    validLineCount++;
                                    if (validLineCount >= bingoPattern) return true; // Return early if condition is met
                                }

                                //check if 4 cordner
                                let row4Corner = [
                                    cartela.B[0],
                                    cartela.B[4],
                                    cartela.O[0],
                                    cartela.O[4]
                                ];
                                if (is4Corner(row4Corner)) {
                                    validLineCount++;
                                    if (validLineCount >= bingoPattern) return true; // Return early if condition is met
                                }

                                // Return false if validLineCount is less than bingoPattern
                                return false;
                            }


                            //check if the cartela is not disqualified
                            if(checkCartelaStatus(cartelaData.cartela_id)){
                                if (checkForLine(cartelaData.cartela, bingoPattern)) {
                                    winnerFound = true;

                                    $("#tagsInputContainer").addClass("disabled_div");//disable input div
                                    $(".winnerDetails").removeClass('dnone');
                                    $('.winnerDetails').prepend(`
                                        <div class="alert alert-success" role="alert">
                                            Cartela <b style="font-size: 1.1rem;">${cartelaData.cartela_id}</b> is a Winner!
                                            <br><h6><b>Winner Payout Amount:</b> ${$('#payout').text()} Birr</h6>
                                        </div>
                                    `);

                                    winnerCartela.push(cartelaData.cartela_id);//add winner cartela
                                    winnerCartelaCard.push(cartelaData.cartela);
                                } else {
                                    $("#tagsInputContainer").addClass("disabled_div");//disable input div
                                    $(".winnerDetails").removeClass('dnone');
                                    $('.cartela-'+cartelaData.cartela_id).remove();//remove if duplicate result happen with already disqualified item
                                    $('.winnerDetails').append(`
                                        <div class="alert alert-warning cartela-${cartelaData.cartela_id}" role="alert">
                                            <span style="margin-right: 5px;">Cartela <b style="font-size: 1.1rem;">${cartelaData.cartela_id}</b> is not a Winner</span> 
                                            <button class="btn btn-warning btn-sm disc_cabtn" onclick="disculify_cartela(${cartelaData.cartela_id})">Lock</button>
                                        </div>
                                    `);
                                }
                            }else{
                                $("#tagsInputContainer").addClass("disabled_div");//disable input div
                                $(".winnerDetails").removeClass('dnone');
                                $('.cartela-'+cartelaData.cartela_id).remove();//remove if duplicate result happen with disqualified item
                                $('.winnerDetails').append(`
                                    <div class="alert alert-danger cartela-${cartelaData.cartela_id}" role="alert">
                                        Cartela <b style="font-size: 1.1rem;">${cartelaData.cartela_id}</b> is already disculified from the game!
                                    </div>
                                `);
                                // Send "no winner found" and disqualified cartela to the game console
                                const message = JSON.stringify({ type: 'disculify-cartela', number: cartelaData.cartela_id });
                                wsClient.send(message);
                            }

                        }//if
                    }
                }

                window.disculify_cartela = function (disculify_id) {
                    disculifiedCartela.push(disculify_id);
                    $('.disc_cabtn').hide();
                    $(`.cartela-${disculify_id} span`).empty().append(`
                        Cartela <b style="font-size: 1.1rem;">${disculify_id}</b> is not a Winner | Disculified
                    `);
                    // Send "no winner found" and disqualified cartela to the game console
                    const message = JSON.stringify({ type: 'disculify-cartela', number: disculify_id });
                    wsClient.send(message);
                };

                //if winner does not found
                if(winnerFound == false){
                    $('#checkWinnerModal .btn-primary').addClass('dnone');
                    $('#checkWinnerModal .btn-success').removeClass('dnone');
                    //send no winner found and disculified cartela to game console
                    const message = JSON.stringify({ type: 'no-winner'});
                    wsClient.send(message);
                }else{
                    //check if winner length is less that or equla to winner per game setting
                    if(winnerCartela.length <= parseInt(winnerPerGame)){

                        if(winnerCartela.length >= 2){
                            var payout_win = parseFloat($('#payout').text())/parseInt(winnerCartela.length);
                            $('.winnerDetails .alert h6').empty().append(`<b>Winner Payout Amount:</b> ${payout_win} Birr`);
                        }
                        
                        //if winner is found
                        $('#checkWinnerModal .btn-primary').addClass('dnone');
                        //send winner found and disculified cartela to game console
                        const message = JSON.stringify({ 
                            type: 'winner-found', 
                            winner_number: winnerCartela, 
                            disculified_number: disculifiedCartela,
                            payout: parseInt($('#payout').text()),
                            bingo_pattern: bingoPattern,
                            drawn_number: DrawNumberSend,
                            winner_card: winnerCartelaCard
                        });
                        wsClient.send(message);
                        //update report
                        loader.show();
                        batchGameEnd2 = writeBatch(db);//add new batch check
                        await add_report('completed');
                        await winnerEnd(winnerCartela);
                        await excuteAllGameFunction();
                        //reste game
                        restartGame();
                    }else{
                        $('.winnerDetails').prepend(`
                            <div class="alert alert-danger" role="alert">
                                Cartela <b style="font-size: 1.4rem;"><h6>There are more than ${winnerPerGame} winners. The game will restart.</h6>
                            </div>
                        `);
                        //send winner found and disculified cartela to game console
                        const message = JSON.stringify({ 
                            type: 'winner-more-found',
                            winner_number: winnerCartela, 
                            winner_size: winnerPerGame
                        });
                        wsClient.send(message);
                        restart_game_more_winner();
                    }
                }

                //check added cartela for check status active/deactive
                function checkCartelaStatus(cartelaIDS) {
                    const cartelas = JSON.parse(localStorage.getItem('cartelas')) || [];
                    for (const cartela of cartelas) {
                        if (cartelaIDS == cartela.cartelaId && cartela.status === "active") {
                            return true;
                        }
                    }
                    return false;
                }
            }else{
                alert('One or more cartela are not included in the Game!');
            }
        }else{
            alert('No cartela selected to check');
        }

        //disable check and resume game button for 4 second and enable
        document.querySelector('#checkWinnerForm').disabled = true;
        setTimeout(function(){
            document.querySelector('#checkWinnerForm').disabled = false;
        }, 4000);
        
    });



    //---------------check winner--------------------------
    function disculifyCartela(id){
        let cartelas = JSON.parse(localStorage.getItem('cartelas')) || [];
        // Find the index of the cartela with the given ID
        const index = cartelas.findIndex(cartel => cartel.cartelaId === id);
        if (index !== -1) {
            // If cartela already exists, update its type
            cartelas[index].status = "deactive";
            // Save the updated array back to localStorage
            localStorage.setItem('cartelas', JSON.stringify(cartelas));

            const docRef = doc(gameSessionCollection, cartelaSessionId);
            const updatedcartelas = JSON.parse(localStorage.getItem('cartelas')) || [];
            updateDoc(docRef, {
                cartelas: updatedcartelas
            });
                
        }
    }



    //restart the game
    function restartGame() {

        //hide and show btn
        $('#clearCartela').show();
        $('#checkWinnerForm').addClass('dnone');

        // Empty and rebuild the bingo board
        $('.bingo-row').empty();
        add_bingo_div(); // Re-add bingo div structure
        $('.ball').remove(); // Remove all drawn balls
        $('.drawing-text').text('Drawing ...');

        // Reset game session variables
        cartelaSession = 0;
        $('.cartela-card').attr('data-cartela-count', 0);
        drawnNumbers = [];
        isPaused = false;

        // Clear the interval for drawing numbers and reset its variable
        drawInterval = null;  

        // Clear localStorage data related to the game
        localStorage.removeItem('drawnNumbers'); // Clear drawn numbers

        // Re-enable cartela selection
        $('.cartela_selection_div').removeClass('disabled_div');

        // Hide and reset cashier gameplay section
        $('.game_play_cashier').css('display', 'none').removeClass('show-slide-down');

        // Reset countdown modal and timer
        $('#countdownModal').modal('hide'); // Hide countdown modal
        $('#countdownTimer').text(''); // Clear countdown timer text

        // Reset the drawn numbers display and animations
        $('#gameStatus').html(''); // Clear game status message
        $('.bingo-item').css('background-color', ''); // Reset bingo item colors
        $('.bingo-item').removeClass('popout'); // Remove popout animation class

        //$('.btn-pause').removeClass('dnone');
        $(".btn-play").empty();
        $(".btn-play").append('<i class="fas fa-play-circle"></i> Play Game');
        $('.btn-play').addClass('dnone');

        // Re-enable the start button
        $('#startGame').prop('disabled', false);

        //update cartela enable inactive cartela for the next game
        let cartelase = JSON.parse(localStorage.getItem('cartelas') || '[]');
        cartelase = cartelase.map(cartela => {
            return { ...cartela, status: "active" };
        });
        localStorage.setItem('cartelas', JSON.stringify(cartelase));
        
        loader.hide();

        wsClient.close();
        connectWebSocket();
    }

    //restart the game
    function restart_game_more_winner() {
        // Empty and rebuild the bingo board
        $('.bingo-row').empty();
        add_bingo_div(); // Re-add bingo div structure
        $('.ball').remove(); // Remove all drawn balls
        $('.drawing-text').text('Drawing ...');

        // Reset game session variables
        cartelaSession = 0;
        $('.cartela-card').attr('data-cartela-count', 0);
        drawnNumbers = [];
        isPaused = false;

        // Clear the interval for drawing numbers and reset its variable
        drawInterval = null;  

        // Clear localStorage data related to the game
        localStorage.removeItem('drawnNumbers'); // Clear drawnumber

        $('#checkWinnerForm').prop('disabled', true);
        $('#checkWinner').addClass('dnone');
        $('.btn-pause-play').addClass('dnone');
        $('.restart_game').removeClass('dnone');

        const docRef = doc(gameSessionCollection, cartelaSessionId);
        updateDoc(docRef, {
            winningcartelas: [],
            drawnNumbers: [],
        });


        //update cartela enable inactive cartela for the next game
        let cartelase = JSON.parse(localStorage.getItem('cartelas') || '[]');
        cartelase = cartelase.map(cartela => {
            return { ...cartela, status: "active" };
        });
        localStorage.setItem('cartelas', JSON.stringify(cartelase));

        wsClient.close();
        connectWebSocket();
    }


    //add winner and end game
    async function winnerEnd(cartelaIds){

        shopBalance = parseFloat(shopBalance)-parseFloat(gameCommission);
        $('.shopBalance, #balanceAmount').text(shopBalance+' Birr');

        var new_draw = parseInt(draw_number_session)+1;
        // Reset to 1 if it exceeds 99, otherwise format with leading zero
        if (new_draw > 99) {
            new_draw = "01";
        } else {
            new_draw = new_draw.toString().padStart(2, "0"); // Ensure 2-digit format
        }

        //check shop balance 5 game after 0 is allowed
        balance_check = parseInt(balance_check)+1;


        //add backup before update for netweok failed purposes
        docBackup1 = [{
            balance: shopBalance,
            balance_check: balance_check,
            draw_number_session: new_draw
        }];
        //update data db
        batchGameEnd2.update(shopRef, {
            balance: shopBalance,
            balance_check: balance_check,
            draw_number_session: new_draw
        });
        if(parseInt(shopBalance) <= 0){
            if(parseInt(balance_check) >= 5){
                const lowBalanceModal = new bootstrap.Modal(document.getElementById('lowBalanceModal'), {
                    backdrop: 'static',
                    keyboard: false,
                });
                lowBalanceModal.show();
            }
        }

        draw_number_code = company_code+new_draw;
        draw_number_session = new_draw;
        $('#draw_number').text(draw_number_code);

        //shop collected amount
        todayCollectedAmount += parseFloat(gameCommission);
        $('.collectedAmount').text(`${todayCollectedAmount} Birr`);


        //add backup before update for netweok failed purposes
        docBackup2 = [{
            gameSessionCollection: gameSessionCollection,
            cartelaSessionId: cartelaSessionId,
            winningcartelas: cartelaIds,
            bingo_pattern_used: bingoPattern,
        }];
        //update game session with winning cartela
        const docRef = doc(gameSessionCollection, cartelaSessionId);
        batchGameEnd2.update(docRef, {
            winningcartelas: cartelaIds,
            bingo_pattern_used: bingoPattern,
        });
        cartelaSessionId = 'SI'+generateID();

        GameStatusPage = "game end";
    }


    add_bingo_div();
    function add_bingo_div(){
        // Populate each row with the corresponding numbers
        const rows = {
            'row-b': Array.from({ length: 15 }, (_, i) => i + 1),      // Numbers 1-15
            'row-i': Array.from({ length: 15 }, (_, i) => i + 16),     // Numbers 16-30
            'row-n': Array.from({ length: 15 }, (_, i) => i + 31),     // Numbers 31-45
            'row-g': Array.from({ length: 15 }, (_, i) => i + 46),     // Numbers 46-60
            'row-o': Array.from({ length: 15 }, (_, i) => i + 61)      // Numbers 61-75
        };

        // Loop through each row and append numbers
        $.each(rows, function(rowId, numbers) {
            $.each(numbers, function(index, number) {
                $('#' + rowId).append('<div class="bingo-item bingo-item-' + number + '">' + number + '</div>');
            });
        });
    }//add bingo div

    // Function to add a tag
    function addTag(tagText) {
        // Check if tagText is valid and if the number of tags is less than winner per Game
        if (tagText && !tags.includes(tagText) /*&& tags.length < winnerPerGame*/) {
            tags.push(tagText);

            // Create tag element
            const tag = document.createElement("span");
            tag.classList.add("tag-custom");
            tag.dataset.tagText = tagText; // Set a custom attribute to identify the tag
            tag.innerHTML = `${tagText} <span class="remove-tag-custom">&times;</span>`;

            // Add event listener to remove tag on click
            tag.querySelector(".remove-tag-custom").addEventListener("click", () => {
                removeTag(tagText);
            });

            // Insert the tag before the input field
            tagsInputContainer.insertBefore(tag, tagInput);

            // Clear the input field
            tagInput.value = "";

            // Disable the input if the maximum number of tags is reached
            /*if (tags.length >= winnerPerGame) {
                tagInput.disabled = true;
            }*/
        }
    }

    // Function to remove a tag
    function removeTag(tagText) {
        // Remove the tag from the tags array
        tags = tags.filter(tag => tag !== tagText);

        // Find the tag element by the custom data attribute and remove it
        const tagElements = tagsInputContainer.querySelectorAll(".tag-custom");
        tagElements.forEach(tagElement => {
            if (tagElement.dataset.tagText === tagText) {
                tagsInputContainer.removeChild(tagElement);
            }
        });

        // Re-enable the input if tags are less than the limit
        /*if (tags.length < winnerPerGame) {
            tagInput.disabled = false;
        }*/
    }


    // Event listener to add tag on pressing "Enter"
    tagInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevents form submission or default behavior
            addTag(tagInput.value.trim());
        }
    });

    // Event listener to add tag when input loses focus (blur)
    tagInput.addEventListener("blur", function () {
        addTag(tagInput.value.trim());
    });


    //game stake
    $('.game_stake').click(function(){
        Swal.fire({
            title: 'Add Game Stake',
            input: 'number',
            inputPlaceholder: '100',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to add a game stake!';
                }
                if (value < 10) {
                    return 'The minimum game stake is 10!';
                }
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                loader.show();
                const stake = result.value;
                await updateDoc(shopRef, {
                    game_stake: stake
                });
                GameStake = stake;
                $('#GameStake').text(`${GameStake}.00`);
                $('.game_stake_st').text(GameStake+' Birr');
                updateTotalStake();//update game info
                loader.hide();
                showSuccessMessage();
            }
        });
    });

    function stakeCommission() {
        var playerSize = selectedCartelas.length;

        // Check if playerSize falls within the ranges and calculate commission
        let commission = 0;

        // Helper function to validate inputs
        function isValid(value) {
            return value !== undefined && value !== null && value !== "" && value !== 0;
        }

        // Helper function to check playerSize against min and max
        function isWithinRange(playerSize, min, max) {
            if (!isValid(max)) {
                // If max is invalid, only check min
                return playerSize >= min;
            }
            return playerSize >= min && playerSize <= max;
        }

        // Check conditions and calculate commission
        if (
            isValid(min_player1) &&
            isValid(commission_percent1) &&
            isWithinRange(playerSize, min_player1, max_player1)
        ) {
            commission = GameStake * playerSize * (commission_percent1 / 100);
            gameCommissionPercent = commission_percent1;
        } else if (
            isValid(max_player1) &&
            isValid(min_player2) &&
            isValid(commission_percent2)&&
            isWithinRange(playerSize, min_player2, max_player2)
        ) {
            commission = GameStake * playerSize * (commission_percent2 / 100);
            gameCommissionPercent = commission_percent2;
        } else if (
            isValid(max_player1) &&
            isValid(max_player2) &&
            isValid(min_player3) &&
            isValid(commission_percent3) &&
            isWithinRange(playerSize, min_player3, max_player3)
        ) {
            commission = GameStake * playerSize * (commission_percent3 / 100);
            gameCommissionPercent = commission_percent3;
        } else if (
            isValid(max_player1) &&
            isValid(max_player2) &&
            isValid(max_player3) &&
            isValid(min_player4) &&
            isValid(commission_percent4) &&
            playerSize >= min_player4 // Only check if playerSize is greater than or equal to min_player4
        ) {
            commission = GameStake * playerSize * (commission_percent4 / 100);
            gameCommissionPercent = commission_percent4;
        } /*else {
            console.log("Player size is out of range or configuration values are invalid.");
        }*/

        const stakeValue = parseFloat(GameStake) || 0;
        const totalStake = stakeValue * selectedCartelas.length;
        let payout = totalStake - commission;

        // Extract the last digit of the payout amount
        const lastDigit = payout % 10;

        // Adjust payout and commission based on the last digit
        if (lastDigit >= 1 && lastDigit < 5) {
            payout -= lastDigit; // Reduce the payout to make the last digit 0
            commission += lastDigit; // Add the last digit to the commission
        } else if (lastDigit > 5 && lastDigit <= 9) {
            const difference = lastDigit - 5;
            payout -= difference; // Adjust payout to end with 5
            commission += difference; // Add the difference to the commission
        }

        return parseInt(commission); // Return the calculated commission
    }

    //change game language
    $('.game_language').click(function(){
        Swal.fire({
            title: 'Change Game Language',
            input: 'select',
            inputOptions: {
                'amharic men': 'Amharic Men',
                'amharic women': 'Amharic Women',
                'oromiffa men': 'Oromiffa Men',
                'tigrinya men': 'Tigrinya Men',
                'english women': 'English Women'
            },
            inputPlaceholder: 'Select a language',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to select a language!';
                }
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                loader.show();
                await updateDoc(shopRef, {
                    game_language: result.value
                });
                GameLanguage = result.value;
                $('.game_language_st').text(GameLanguage);
                loader.hide();
                showSuccessMessage();
            }
        });
    });

    //changebingo pattern to win
    $('.winner_per_game').click(function(){
        Swal.fire({
            title: 'Bingo Winner per Game',
            input: 'number',
            inputPlaceholder: 'Number of winner per game',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to add value!';
                }
                if (value > 3) {
                    return 'Maximum number allowed is 3';
                }
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                loader.show();
                await updateDoc(shopRef, {
                    winner_per_game: result.value
                });
                winnerPerGame = result.value;
                $('.winner_per_game_st').text(`
                    ${
                        winnerPerGame == 1 ? "1 Person" : 
                        winnerPerGame == 2 ? "2 Person" : 
                        winnerPerGame == 3 ? "3 Person" : "Unknown"
                     }
                `);
                loader.hide();
                showSuccessMessage();
            }
        });
    });

    //change game language
    $('.bingo_patter_win').click(function(){
        Swal.fire({
            title: 'Bingo Pattern to Win',
            input: 'select',
            inputOptions: {
                '1': '1 Line',
                '2': '2 Line',
                '3': '3 Line',
                '4': '4 Line',
                '5': 'Full House / 5 Line'
            },
            inputPlaceholder: 'Select pattern',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to add value!';
                }
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                loader.show();
                await updateDoc(shopRef, {
                    bingo_pattern: result.value
                });
                bingoPattern = result.value;
                $('.bingo_patter_win_st').text(`
                    ${
                       bingoPattern == 1 ? "1 Line" : 
                       bingoPattern == 2 ? "2 Line" : 
                       bingoPattern == 3 ? "3 Line" :
                       bingoPattern == 4 ? "4 Line" :
                       bingoPattern == 5 ? "Full House" : "Unknown"
                    }
               `);
                loader.hide();
                showSuccessMessage();
            }
        });
    });

    //change speed
    $('.game_speed').click(function(){
        Swal.fire({
            title: 'Change Game Speed',
            input: 'select',
            inputOptions: {
                '3000': 'High',
                '5000': 'Medium (Recommend)',
                '7000': 'Slow',
            },
            inputPlaceholder: 'Select game speed',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to select game speed!';
                }
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                loader.show();
                await updateDoc(shopRef, {
                    game_speed: result.value
                });
                GameSpeed = result.value;
                $('.game_speed_st').text(`
                    ${
                        GameSpeed == 3000 ? "High" : 
                        GameSpeed == 5000 ? "Medium" : 
                        GameSpeed == 7000 ? "Slow" : "Unknown"
                    }
                `);
                loader.hide();
                showSuccessMessage();
            }
        });
    });


    //-----------------report-------------------
    let todayCollectedAmount = 0;
    $('.collectedAmount').text(`${todayCollectedAmount} Birr`);
    var gameTable = $('#game_session_table').DataTable({
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Search records"
        },
        ordering: true, // Enable ordering
        order: [[0, 'desc']],
        "pageLength": 10
    });

    var cashTable = $('#cash_report_table').DataTable({
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Search records"
        },
        ordering: false,
        "pageLength": 10
    });

    $('.daterange-btn').daterangepicker(
        {
            ranges   : {
            'Today'       : [moment(), moment()],
            'Yesterday'   : [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Today & Yesterday' : [moment().subtract(1, 'days'), moment()],
            },
            startDate: moment().subtract(1, 'days'),
            endDate  : moment(),
            showCustomRangeLabel: false
        },
        function (start, end) {
            $('.daterange-btn span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));

            var currentDate = new Date(start)
            var startDate = start;
            var endDate = new Date(end);
            var between = [];

            while (currentDate <= endDate) {
                between.push(new Date(currentDate));

                var day = endDate.getDate();
                var month = endDate.getMonth()+parseInt(1);
                var year = endDate.getFullYear();

                if (/^\d$/.test(day)){var nday = 0+""+day}
                else{var nday = day}

                if (/^\d$/.test(month)){var nmonth = 0+""+month}
                else{var nmonth = month}

                var tables = $(`#game_session_table`).DataTable();
                tables.clear().draw(false);

                load_data_report(nday+"-"+nmonth+"-"+year);
                endDate.setDate(endDate.getDate() - 1);
            }
        }
    );
    // Detect which range is selected
    $('.daterange-btn').on('apply.daterangepicker', function (ev, picker) {
        let selectedRange = Object.keys(picker.ranges).find((key) => {
            return (
                picker.startDate.isSame(picker.ranges[key][0], 'day') &&
                picker.endDate.isSame(picker.ranges[key][1], 'day')
            );
        });

        if (selectedRange != 'Yesterday') {
            todayCollectedAmount = 0;
        }
    });

    //----------------------------Load the last current data -----------------------------//
    let currentDatem = moment(); // Start from the current date
    const startDatem = moment().subtract(1, 'days');
    // Iterate through each day from the current date to yestrday
    while (currentDatem >= startDatem) {
        const day = currentDatem.date().toString().padStart(2, '0'); // Pad day with leading zero
        const month = (currentDatem.month() + 1).toString().padStart(2, '0'); // Month is 0-indexed
        const year = currentDatem.year();

        const formattedDate = `${day}-${month}-${year}`;
        load_data_report(formattedDate);
        currentDatem.subtract(1, 'days');// Move to the previous day
    }

    //load shop data
    async function load_data_report(date_game){
        //get today data for today collected amount
        const datet = new Date(); 
        const day = datet.getDate().toString().padStart(2, '0');
        const month = (datet.getMonth() + 1).toString().padStart(2, '0');
        const year = datet.getFullYear();

        const today_date = `${day}-${month}-${year}`;
        if(today_date == date_game){

            const docRefTotal = doc(collection(db, `report/${date_game}/general`), shopID);
            const docSnapTotal = await getDoc(docRefTotal);

            if(docSnapTotal.exists()){
                const dataTotal = docSnapTotal.data();

                todayCollectedAmount = dataTotal.commission_amount;
                $('.collectedAmount').text(`${dataTotal.commission_amount || 0} Birr`);
            }
        }

        //load report
        const gameSessionRef = collection(db, `game_session/${date_game}/list`);
        const gameSessionQuery = query(gameSessionRef, where("shopID", "==", shopID), orderBy("startTime", "desc"));
        onSnapshot(gameSessionQuery, (snapshot) => {
            snapshot.docs.forEach((doc) => {

                const val = doc.data();
                const docid = doc.id;
                var row_id = val.id;

                var button = `
                    <button class="btn btn-secondary btn-sm" onclick="view_game_report('${date_game}', '${docid}')">
                        view
                    </button>
                `;

                if(val.winningcartelas.length > 0){
                    var status = "<span style='color: green;'>completed</span>";
                }else{
                    var status = "<span style='color: red;'>not completed</span>"
                }

                var row_data = [
                    moment(date_game, "DD-MM-YYYY").format("MMMM D, YYYY"),
                    val.id,
                    status,
                    (val?.accounting?.commission ?? 0) + " Birr",
                    button
                ];
                $(gameTable.row.add(row_data).draw().node()).attr('id', docid);

            });

        });
        $('.loaderc').hide();
    }


    let currentDates = moment(); // Start from the current date
    const startDates = moment().subtract(29, 'days');
    // Iterate through each day from the current date to yestrday
    while (currentDates >= startDates) {
        const day = currentDates.date().toString().padStart(2, '0'); // Pad day with leading zero
        const month = (currentDates.month() + 1).toString().padStart(2, '0'); // Month is 0-indexed
        const year = currentDates.year();

        const formattedDate = `${day}-${month}-${year}`;
        load_cash_report(formattedDate);
        currentDates.subtract(1, 'days');// Move to the previous day
    }
    async function load_cash_report(date_game){

        const docRef = doc(collection(db,`report/${date_game}/general`), shopID);
        const docSnap = await getDoc(docRef);

        if(docSnap.exists()){
            const data = docSnap.data();
            var row_data = [
                moment(date_game, "DD-MM-YYYY").format("MMMM D, YYYY"),
                data.total_payin+' Birr',
                data.total_payout+' Birr',
                data.commission_amount+' Birr',
                data.total_amount_refund+' Birr'
            ];
            $(cashTable.row.add(row_data).draw().node()).attr('id', date_game+shopID);
        }
    }

    window.view_game_report = async function(date, id) {
        $('.loader').show();
        $('#view_game_session_modal .modal-body div').empty();
        $('#view_game_session_modal .table tbody').empty();

        const docRef = doc(collection(db, `game_session/${date}/list`), id);
        const docSnap = await getDoc(docRef);

        const data = docSnap.data();

        $(".viewID").append(`<span><b>Game ID: </b>${data.id}</span>`);
        $(".viewShopID").append(`<span><b>Shop ID: </b>${data.shopID}</span>`);
        $(".viewUser").append(`<span><b>User: </b>${data.user}</span>`);
        
        let start_date = "";
        if(data.startTime != undefined && data.startTime != ""){
            start_date = data.startTime.toDate().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
        $(".viewStartTime").append(`<span><b>Start Time: </b>${start_date}</span>`);

        let end_date = "";
        if(data.endTime != undefined && data.endTime != ""){
            end_date = data.endTime.toDate().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            });
            $(".viewEndTime").append(`<span><b>End Date: </b>${end_date}</span>`);
        }
        $(".viewStake").append(`<span><b>Game Stake: </b>${data.accounting.stake} Birr</span>`);
        $(".viewTotalStake").append(`<span><b>Total Stake: </b>${data.accounting.total_stake} Birr</span>`);
        $(".viewTotalPlayer").append(`<span><b>Total Player: </b>${data.accounting.total_player}</span>`);
        $(".viewPayout").append(`<span><b>Payout: </b>${data.accounting.payout} Birr</span>`);
        $(".viewCommission").append(`<span><b>Commission: </b>${data.accounting.commission} Birr</span>`);
        $(".viewBingoPattern").append(`<span><b>Bingo Pattern Used: </b>${data.bingo_pattern_used || ''} Line</span>`);

        let drawnNumbers = data.drawnNumbers
            .map((num) => `<span style="display: inline-block; padding: 5px 10px; margin: 2px; border: 1px solid #ccc; border-radius: 5px;">${num}</span>`)
            .join("");

        $(".viewDrawnNumber").append(
            `<div><b>Drawn Numbers: </b>${drawnNumbers}</div>`
        );


        let winningNumbers = data.winningcartelas
            .map((num) => `<span style="display: inline-block; padding: 5px 10px; margin: 2px; border: 1px solid #ccc; border-radius: 5px; background-color: rgb(72, 148, 9); color: #fff;">${num}</span>`)
            .join("");

        $(".viewWinningCartela").append(
            `<div><b>Winning Cartela: </b>${winningNumbers}</div>`
        );

        if(data.winningcartelas.length > 0){
            $('.viewGameStatus').text('Completed');
        }else{
            $('.viewGameStatus').text('Not Completed');    
        }

        for(let i=0; i<data.cartelas.length; i++){
            var num = parseInt(i)+1;
            $(".viewSelectedCartela").append(`
            <tr>
                <th>${num}</th>
                <td>${data.cartelas[i].cartelaId}</td>
                <td>${data.cartelas[i].cartelaType}</td>
                <td>${data.cartelas[i].cashierID}</td>
                <td><span class="badge bg-success">${data.cartelas[i].status}</span></td>
            </tr>
            `);
        }

        $('#view_game_session_modal').modal('toggle');
        $('.loader').hide();
    }


    //-------------------------view and edit cartela---------------------------------
    $('.manage_cartela').click(async function(){
        $('.loader').show();
        $('#searchInput').val();
        const cartelRef = collection(db, `shop_data/cartela/${shopID}`);
      
        // Function to update data in localStorage
        function updateLocalStorage(data) {
          localStorage.setItem('cartela_edit', JSON.stringify(data));
        }
      
        // Load shop data
        const cartelaQuery = query(cartelRef, orderBy("cartela_id", "asc"));
        onSnapshot(cartelaQuery, (snapshot) => {
          let cartelaData = [];
          snapshot.docs.forEach((doc) => {
            var val = doc.data();
            var docid = doc.id;
            
            $('.cartela_list').append(`
              <div class="col-md-6 col-lg-4 mb-3">
                <div class="card">
                  <div class="card-content">
                    <div class="cartela-header">
                      <div class="cartela-cell">B</div>
                      <div class="cartela-cell">I</div>
                      <div class="cartela-cell">N</div>
                      <div class="cartela-cell">G</div>
                      <div class="cartela-cell">O</div>
                    </div>
                    <div class="cartela">
                      <!-- Row 1 -->
                      <div class="cartela-cell">${val.cartela.B[0]}</div>
                      <div class="cartela-cell">${val.cartela.I[0]}</div>
                      <div class="cartela-cell">${val.cartela.N[0]}</div>
                      <div class="cartela-cell">${val.cartela.G[0]}</div>
                      <div class="cartela-cell">${val.cartela.O[0]}</div>
                      <!-- Row 2 -->
                      <div class="cartela-cell">${val.cartela.B[1]}</div>
                      <div class="cartela-cell">${val.cartela.I[1]}</div>
                      <div class="cartela-cell">${val.cartela.N[1]}</div>
                      <div class="cartela-cell">${val.cartela.G[1]}</div>
                      <div class="cartela-cell">${val.cartela.O[1]}</div>
                      <!-- Row 3 -->
                      <div class="cartela-cell">${val.cartela.B[2]}</div>
                      <div class="cartela-cell">${val.cartela.I[2]}</div>
                      <div class="cartela-cell">${val.cartela.N[2]}</div>
                      <div class="cartela-cell">${val.cartela.G[2]}</div>
                      <div class="cartela-cell">${val.cartela.O[2]}</div>
                      <!-- Row 4 -->
                      <div class="cartela-cell">${val.cartela.B[3]}</div>
                      <div class="cartela-cell">${val.cartela.I[3]}</div>
                      <div class="cartela-cell">${val.cartela.N[3]}</div>
                      <div class="cartela-cell">${val.cartela.G[3]}</div>
                      <div class="cartela-cell">${val.cartela.O[3]}</div>
                      <!-- Row 5 -->
                      <div class="cartela-cell">${val.cartela.B[4]}</div>
                      <div class="cartela-cell">${val.cartela.I[4]}</div>
                      <div class="cartela-cell">${val.cartela.N[4]}</div>
                      <div class="cartela-cell">${val.cartela.G[4]}</div>
                      <div class="cartela-cell">${val.cartela.O[4]}</div>
                    </div>
                    <div class="cartela-footer">
                      <h4 class="cartela-cell cartela-title">Cartela ${val.cartela_id}</h4>
                      <button class="btn btn-secondary edit_cartela" data-id="${docid}" data-shop-id="${shopID}">Edit</button>
                    </div>
                  </div>
                </div>
              </div>
            `);
      
            // Add the data and document ID to the array
            cartelaData.push({
              docid: docid,
              cartela: val.cartela,
              cartela_id: val.cartela_id
            });
      
          });
           // Store the updated data in localStorage
          updateLocalStorage(cartelaData);
      
          $('#view_cartela_modal').modal('show');
          $('.loader').hide();
        });
      
    });//cartela function
      
    $(document).on('click', '.edit_cartela', async function(){
        var cartela_id = $(this).attr('data-id');
        var shop_id = $(this).attr('data-shop-id');
      
        $('#edit_cartela_modal .modal-body').attr('data-cartela-id', cartela_id);
        $('#edit_cartela_modal .modal-body').attr('data-shop-id', shop_id);
      
        $('.loader').show();
        $('#edit_cartela_modal .modal-body').empty();
        
        const docRef = doc(collection(db, `shop_data/cartela/${shop_id}`), cartela_id);
        const docSnap = await getDoc(docRef);

        const val = docSnap.data();
      
        $('#edit_cartela_modal .modal-body').append(`
          <div class="card">
            <div class="card-content">
              <div class="cartela-header">
                <div class="cartela-cell">B</div>
                <div class="cartela-cell">I</div>
                <div class="cartela-cell">N</div>
                <div class="cartela-cell">G</div>
                <div class="cartela-cell">O</div>
              </div>
              <div class="cartela cartela_to_update">
                <!-- Row 1 -->
                <div class="cartela-cell"><input type="text" class="form-control b0" required value="${val.cartela.B[0]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control i0" required value="${val.cartela.I[0]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control n0" required value="${val.cartela.N[0]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control g0" required value="${val.cartela.G[0]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control o0" required value="${val.cartela.O[0]}" /></div>
                <!-- Row 2 -->
                <div class="cartela-cell"><input type="text" class="form-control b1" required value="${val.cartela.B[1]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control i1" required value="${val.cartela.I[1]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control n1" required value="${val.cartela.N[1]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control g1" required value="${val.cartela.G[1]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control o1" required value="${val.cartela.O[1]}" /></div>
                <!-- Row 3 -->
                <div class="cartela-cell"><input type="text" class="form-control b2" required value="${val.cartela.B[2]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control i2" required value="${val.cartela.I[2]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control n2" required value="${val.cartela.N[2]}" disabled/></div>
                <div class="cartela-cell"><input type="text" class="form-control g2" required value="${val.cartela.G[2]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control o2" required value="${val.cartela.O[2]}" /></div>
                <!-- Row 4 -->
                <div class="cartela-cell"><input type="text" class="form-control b3" required value="${val.cartela.B[3]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control i3" required value="${val.cartela.I[3]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control n3" required value="${val.cartela.N[3]}"/></div>
                <div class="cartela-cell"><input type="text" class="form-control g3" required value="${val.cartela.G[3]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control o3" required value="${val.cartela.O[3]}" /></div>
                <!-- Row 5 -->
                <div class="cartela-cell"><input type="text" class="form-control b4" required value="${val.cartela.B[4]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control i4" required value="${val.cartela.I[4]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control n4" required value="${val.cartela.N[4]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control g4" required value="${val.cartela.G[4]}" /></div>
                <div class="cartela-cell"><input type="text" class="form-control o4" required value="${val.cartela.O[4]}" /></div>
              </div>
              <div class="cartela-footer">
                <h4 class="cartela-cell cartela-title">Cartela ${val.cartela_id}</h4>
              </div>
            </div>
          </div>
        `);
        $('#edit_cartela_modal').modal('show');
        $('.loader').hide();
    });
      
    $('#updateCartela').submit(async function(e){
        e.preventDefault();
      
        $('.loader').show();
        var cartela_id = $('#edit_cartela_modal .modal-body').attr('data-cartela-id');
        var shop_id = $('#edit_cartela_modal .modal-body').attr('data-shop-id');
      
        var cartela_data = {
          B:[
            $('.b0').val(),
            $('.b1').val(),
            $('.b2').val(),
            $('.b3').val(),
            $('.b4').val(),
          ],
          I:[
            $('.i0').val(),
            $('.i1').val(),
            $('.i2').val(),
            $('.i3').val(),
            $('.i4').val(),
          ],
          N:[
            $('.n0').val(),
            $('.n1').val(),
            $('.n2').val(),
            $('.n3').val(),
            $('.n4').val(),
          ],
          G:[
            $('.g0').val(),
            $('.g1').val(),
            $('.g2').val(),
            $('.g3').val(),
            $('.g4').val(),
          ],
          O:[
            $('.o0').val(),
            $('.o1').val(),
            $('.o2').val(),
            $('.o3').val(),
            $('.o4').val(),
          ]
        };
      
        //----------check if valid number value added--------------------
        const validationRanges = {
          B: [1, 15],
          I: [16, 30],
          N: [31, 45],
          G: [46, 60],
          O: [61, 75],
        };
        
        // Function to validate cartela_data values
        function validateCartelaData(data) {
          for (const [key, values] of Object.entries(data)) {
            const [min, max] = validationRanges[key]; // Get range for the current column
            for (let value of values) {
              if(value != "Free"){
                value = parseInt(value, 10); // Convert value to integer
                if (isNaN(value) || value < min || value > max) {
                  return `Invalid value found in column ${key}: ${value}`;
                }
              }
            }
          }
          return true;
        }
        //-----------------------------------------------------
      
      
        //---------------check if there is no similarity between cartela----------------//
        const cartelaEditData = JSON.parse(localStorage.getItem('cartela_edit'));
      
        function isCartelaEqual(cartela1, cartela2) {
          // Compare all columns (B, I, N, G, O)
          return ['B', 'I', 'N', 'G', 'O'].every((key) => {
            // Compare each value in the column arrays
            return cartela1[key].every((val, index) => val == cartela2[key][index]);
          });
        }
      
        let isMatchFound = false;
        let matchFoundData = null;
        if (cartelaEditData) {
          for (const entry of cartelaEditData) {
            //check if cartela is differ from current edited cartela
            if(entry.docid != cartela_id){
              if (isCartelaEqual(cartela_data, entry.cartela)) {
                isMatchFound = true;
                console.log("Match found with:", entry);
                matchFoundData = entry.cartela_id;
                break; // Exit loop if a match is found
              }
            }
          }
        }
      
        //-----------------------------------------------------------------------------
      
      
      
        //check if valid value number added
        var validateCk = validateCartelaData(cartela_data);
        if(validateCk == true){
      
          //check if there is the same cartela exist
          if (!isMatchFound) {
            await updateDoc(doc(db, `shop_data/cartela/${shop_id}/${cartela_id}`), {
                cartela: cartela_data
            });
            $('#edit_cartela_modal').modal('hide');
          }else{
            alert(`Match Found with cartela ${matchFoundData} Please change cartela ${matchFoundData} data before continue!`);
          }
        }else{
          alert(validateCk)
        }
        $('.loader').hide();
        showSuccessMessage();
    });
    // Event listener for the search input
    $('#searchInput').on('input', function() {
        var searchQuery = $(this).val().toLowerCase(); // Get the search query and convert it to lowercase
        
        // Loop through each cartela card and check if the cartela title contains the search query
        $('.cartela-footer').each(function() {
        var cartelaTitle = $(this).find('.cartela-title').text().toLowerCase(); // Get the text of the cartela title
        
        // If the title matches the search query, show the card; otherwise, hide it
        if (cartelaTitle.indexOf(searchQuery) !== -1) {
            $(this).closest('.col-md-6').show(); // Show the parent column of the matching cartela
        } else {
            $(this).closest('.col-md-6').hide(); // Hide the parent column if the title doesn't match
        }
        });
    });
    //-------------------------end view and edit cartela---------------------------------



    //update report
    async function add_report(type){

        const getCurrentDater = () => {
            const currentDatef = new Date();
            const day = currentDatef.getDate().toString().padStart(2, '0');
            const month = (currentDatef.getMonth() + 1).toString().padStart(2, '0');
            const year = currentDatef.getFullYear();

            return `${day}-${month}-${year}`;  // '09-12-2024'
        };
        const formattedDate = getCurrentDater();

        let report_commission_amount = gameCommission;
        let report_total_payin = parseFloat($('#totalStake').text());//total stake
        let report_total_payout = parseFloat($('#payout').text());//payout
        let report_total_ticket = parseFloat($('#totalPlayer').text());//total player
        let report_total_player = parseFloat($('#totalPlayer').text());//total player
        let report_game_completed = 0;

        let report_game_not_completed = 0;
        let report_total_amount_refund = parseFloat($('#totalStake').text());;//for total game not completed
        let report_commission_percent = gameCommissionPercent;//game commission percent used

        //add backup before update for netweok failed purposes
        if(type == "completed"){
            report_game_completed = 1;
            report_game_not_completed = 1;

            docBackup3 = [{
                formattedDate: formattedDate,
                commission_amount: report_commission_amount,
                total_payin: report_total_payin,
                total_payout: report_total_payout,
                total_ticket: report_total_ticket,
                total_player: report_total_player,
                game_completed: report_game_completed,
                game_not_completed: report_game_not_completed,
                total_amount_refund: report_total_amount_refund,
                commission_percent: report_commission_percent,

                belongs_to: shopBelongsTo,//company
                belongs_id: shopBelongsID,//C5365111224
                company_id: companyID,
                shop_commission: shop_commission,
                company_commission: company_commission,
                agent_commission: agent_commission,
            }];
        }

        //check if the data exist and retrive previous data
        const docRef = doc(collection(db, `report/${formattedDate}/general`), shopID);
        const docSnap = await getDoc(docRef);


        if(type == "not-completed"){
            report_game_not_completed = 1;

            if(docSnap.exists()){
                const data = docSnap.data();
                report_game_not_completed = parseFloat(report_game_not_completed)+parseFloat(data.game_not_completed || 0);
                report_total_amount_refund = parseFloat(report_total_amount_refund)+parseFloat(data.total_amount_refund || 0);

                updateDoc(docRef, {
                    game_not_completed: report_game_not_completed,
                    total_amount_refund: report_total_amount_refund,

                    belongs_to: shopBelongsTo,//company
                    belongs_id: shopBelongsID,//
                    company_id: companyID,
                    shop_commission: shop_commission,
                    company_commission: company_commission,
                    agent_commission: agent_commission,
                });
            }else{
                setDoc(docRef, {
                    game_not_completed: report_game_not_completed,
                    total_amount_refund: report_total_amount_refund,

                    commission_amount: 0,
                    total_payin: 0,
                    total_payout: 0,
                    total_ticket: 0,
                    total_player: 0,
                    game_completed: 0,
                    commission_percent: [],

                    belongs_to: shopBelongsTo,//company
                    belongs_id: shopBelongsID,//
                    company_id: companyID,
                    shop_commission: shop_commission,
                    company_commission: company_commission,
                    agent_commission: agent_commission,
                });
            }

        }else if(type == "completed"){
            report_game_completed = 1;
            report_game_not_completed = 1;

            if(docSnap.exists()){
                const data = docSnap.data();
                report_game_not_completed = parseFloat(data.game_not_completed || 0)-parseFloat(report_game_not_completed);
                report_total_amount_refund = parseFloat(data.total_amount_refund || 0)-parseFloat(report_total_amount_refund);

                report_game_completed = parseFloat(data.game_completed || 0)+parseFloat(report_game_completed);

                report_commission_amount = parseFloat(data.commission_amount || 0)+parseFloat(report_commission_amount);
                report_total_payin = parseFloat(data.total_payin || 0)+parseFloat(report_total_payin);
                report_total_payout = parseFloat(data.total_payout || 0)+parseFloat(report_total_payout);
                report_total_ticket = parseFloat(data.total_ticket || 0)+parseFloat(report_total_ticket);
                report_total_player = parseFloat(data.total_player || 0)+parseFloat(report_total_player);
            }
            batchGameEnd2.update(docRef, {
                commission_amount: report_commission_amount,
                total_payin: report_total_payin,
                total_payout: report_total_payout,
                total_ticket: report_total_ticket,
                total_player: report_total_player,
                game_completed: report_game_completed,
                game_not_completed: report_game_not_completed,
                total_amount_refund: report_total_amount_refund,
                commission_percent: arrayUnion(report_commission_percent),

                belongs_to: shopBelongsTo,//company
                belongs_id: shopBelongsID,//C5365111224
                company_id: companyID,
                shop_commission: shop_commission,
                company_commission: company_commission,
                agent_commission: agent_commission,
            });
        }

    }



    //upatupdate all game end function
    async function excuteAllGameFunction(){

        const docBackup1_update = docBackup1;
        const docBackup2_update = docBackup2;
        const docBackup3_update = docBackup3;

        const combinedData = { docBackup1_update, docBackup2_update, docBackup3_update };
        localStorage.setItem('b09c60k12p', JSON.stringify(combinedData));

        await batchGameEnd2.commit()
        .then(() => {
            localStorage.removeItem('b09c60k12p');
            console.log('Batch operation successful!');
        })
        .catch((error) => {
            console.error('Error performing batch operation:', error);
        });
    }


    //check if network is offline
    window.addEventListener('online', () => {
        $(".internet-indicator").hide();
        console.log('network fine');
    });
    window.addEventListener('offline', () => {
        $(".internet-indicator").show();
        console.log('error network');
    });

    function generateID() {
        // Get the current timestamp in milliseconds
        const timestamp = new Date().getTime();

        // Increment the counter if the function is called multiple times in the same millisecond
        counterID = (counterID + 1) % 1000; // Reset counter after 1000 (to stay within 3 digits)

        // Convert the timestamp to a string
        const timestampStr = timestamp.toString();

        // Convert the counter to a string and pad with leading zeros if necessary
        const counterStr = counterID.toString().padStart(3, '0');

        // Generate a random number between 0 and 999, then convert to a 3-digit string
        const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        // Combine timestamp, counter, and random number
        const uniqueID = randomStr + timestampStr + counterStr;

        return uniqueID;
    }
    //get date
    function getDatem(date){
        var day = date.getDate();
        var month = date.getMonth()+parseFloat(1);
        var year = date.getFullYear();

        if (/^\d$/.test(day)){var nday = 0+""+day}
        else{var nday = day}

        if (/^\d$/.test(month)){var nmonth = 0+""+month}
        else{var nmonth = month}

        return nday+"-"+nmonth+"-"+year;
    }

    //enable and disable play, paus and check winner button to disable multiple request
    document.querySelectorAll('.custom-button').forEach(button => {
        button.addEventListener('click', () => {
            // Disable all buttons
            document.querySelectorAll('.custom-button').forEach(btn => {
                btn.disabled = true;
            });

            // Re-enable all buttons after 5 seconds
            setTimeout(() => {
                document.querySelectorAll('.custom-button').forEach(btn => {
                    btn.disabled = false;
                });
            }, 6000);
        });
    });

    function showSuccessMessage(){
        Swal.fire({
            title: 'Success!',
            text: 'Your operation was completed successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
    }

    $('.sign-out-cashier').click(function(){
        signOutUserInner();
    });
    function signOutUserInner(){
        signOut(auth).then(() => {
            // Clear session storage and redirect to login
            localStorage.removeItem('cartelaData');
            localStorage.removeItem('cartelaTimestamp');
            localStorage.removeItem('cartelas');
            localStorage.removeItem('drawnNumbers');
            localStorage.removeItem('shop_data');

            window.location.replace("/login");
        })
        .catch((error) => {
            console.error("Error signing out: ", error);
        });
    }



    function showLoader() {
        const loaderHTML = `
            <div id="pageLoader" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.9); display: flex; justify-content: center; align-items: center; z-index: 9999;">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                        <span style="position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;">Loading...</span>
                    </div>
                    <p style="margin-top: 10px; font-size: 1.2rem; color: #007bff;">Please Wait...</p>
                </div>
            </div>
        `;
        $('body').append(loaderHTML);
    }

    function hideLoader() {
        $('#pageLoader').remove();
    }
})();
