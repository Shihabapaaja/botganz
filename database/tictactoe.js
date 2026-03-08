class TicTacToe {
     constructor(playerX = 'x', playerO = 'o') {
         this.playerX = playerX; // Menyimpan ID pengguna Telegram (number)
         this.playerO = playerO; // Menyimpan ID pengguna Telegram (number)
         this._currentTurn = false; // false = X giliran pertama, true = O
         this._x = 0; // Bitmask untuk posisi X
         this._o = 0; // Bitmask untuk posisi O
         this.turns = 0;
     }
     // Mendapatkan status keseluruhan papan (gabungan X dan O)
     get board() {
         return this._x | this._o;
     }
     // Mendapatkan ID pengguna yang sedang giliran
     get currentTurn() {
         return this._currentTurn ? this.playerO : this.playerX;
     }
     // Mendapatkan ID pengguna lawan
     get enemyTurn() {
         return this._currentTurn ? this.playerX : this.playerO;
     }
     // Mengecek apakah ada pemain yang menang dari bitmask yang diberikan
     static check(state) {
         // Kombinasi kemenangan (bitmask untuk baris, kolom, diagonal)
         const winCombos = [7, 56, 73, 84, 146, 273, 292, 448];
         for (const combo of winCombos) {
             if ((state & combo) === combo) return true;
         }
         return false;
     }
     // Mengonversi posisi (x,y) ke bitmask (tidak digunakan langsung di Telegram, tapi tetap dipertahankan)
     static toBinary(x = 0, y = 0) {
         if (x < 0 || x > 2 || y < 0 || y > 2) throw new Error('Posisi tidak valid (rentang 0-2 untuk x dan y)');
         return 1 << (x + (3 * y));
     }
     /**
      * Proses langkah permainan
      * @param {0|1} player - 0 = X, 1 = O
      * @param {number} pos - Posisi pilihan pengguna (1-9 di Telegram, akan dikonversi ke 0-8 untuk bitmask)
      * @returns {-3|-2|-1|0|1} Kode status langkah
      * - `-3`: Permainan sudah berakhir
      * - `-2`: Bukan giliran pemain
      * - `-1`: Posisi tidak valid (luar rentang 1-9)
      * - `0`: Posisi sudah ditempati
      * - `1`: Langkah berhasil
      */
     turn(player = 0, pos) {
         // Cek apakah papan sudah penuh
         if (this.board === 511) return -3;
         // Konversi posisi dari input Telegram (1-9) ke indeks bitmask (0-8)
         const positionIndex = pos - 1;
         if (positionIndex < 0 || positionIndex > 8) return -1;
         
         const bitPos = 1 << positionIndex;
         // Cek apakah sesuai dengan giliran pemain
         if (this._currentTurn ^ player) return -2;
         // Cek apakah posisi sudah ditempati
         if (this.board & bitPos) return 0;
         // Simpan posisi ke bitmask pemain yang bersangkutan
         if (this._currentTurn) {
             this._o |= bitPos;
         } else {
             this._x |= bitPos;
         }
         // Ganti giliran
         this._currentTurn = !this._currentTurn;
         this.turns++;
         return 1;
     }
     /**
      * Render papan permainan menjadi array simbol
      * @param {number} boardX - Bitmask posisi X
      * @param {number} boardO - Bitmask posisi O
      * @returns {('X'|'O'|1|2|3|4|5|6|7|8|9)[]} Array simbol papan
      */
     static render(boardX = 0, boardO = 0) {
         const x = parseInt(boardX.toString(2), 4);
         const y = parseInt(boardO.toString(2), 4) * 2;
         return [...(x + y).toString(4).padStart(9, '0')]
             .reverse()
             .map((value, index) => {
                 switch (value) {
                     case '1': return 'X';
                     case '2': return 'O';
                     default: return index + 1; // Nomor posisi (1-9)
                 }
             });
     }
     // Render papan permainan dari instance saat ini
     render() {
         return TicTacToe.render(this._x, this._o);
     }
     // Mendapatkan ID pemenang (atau false jika tidak ada pemenang)
     get winner() {
         const xWon = TicTacToe.check(this._x);
         const oWon = TicTacToe.check(this._o);
         return xWon ? this.playerX : oWon ? this.playerO : false;
     }
 }
 module.exports = TicTacToe;