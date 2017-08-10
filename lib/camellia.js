/**
 * Declare camellia object (256-bit key)
 *
 * @namespace
 */
 
var camellia = {}; // Camellia Parent Object
camellia.ecb = {}; // Electronic Codebook (ECB) Mode
camellia.cbc = {}; // Cipher Block Chaining (CBC) Mode
camellia.ctr = {}; // Counter (CTR) Mode

camellia.sbox = {};// Camellia S-Box


/**
 * ECB ENCRYPTION
 *
 * @param {string} plaintext
 * @param {string} key 64 char hexadecimal
 * @return {string} ciphertext
 */
camellia.ecb.encrypt = function(plaintext, key){
	
	// Param validation
	if(typeof plaintext != 'string'){
		console.error('plaintext parameter must be a string');
		return 0;
	}
	
	if(typeof key != 'string' || key.length != 64 || !(/[0123456789abcdef]{64}/gi).test(key)){
		console.error('key parameter must be 32-byte hexadecimal string');
		return 0;
	}
	
	// Encode special characters into single-byte characters
	var plaintext = unescape(encodeURIComponent(plaintext));
	
	// Pad plaintext with whitespace characters
	while(plaintext.length % 16 !== 0){
		plaintext += ' ';
	}
	
	// Blockchain byte size equal to plaintext length
	var output = new Uint8Array(plaintext.length);
	var blockchain = new Uint8Array(plaintext.length);
	
	// Read plaintext character byte values into blockchain
	for(var i = 0, il = plaintext.length; i < il; i++){
		blockchain[i] = plaintext.charCodeAt(i);
	}
	
	// Key Expansions
	var k = new Uint8Array(32);
	for(i = 0; i < 32; i++){
		k[i] = parseInt(key.slice(2 * i, 2 * (i + 1)), 16);
	}
	var expanded_key = camellia.keyschedule(k);
	
	// Encryption loop
	for(var j = 0, jl = blockchain.length / 16; j < jl; j++){
		
		// Temporary variable B for each block
		var B = blockchain.slice(j * 16, (j + 1) * 16);
		
		// Block Cipher Encryption
		B = camellia.cipher(B, expanded_key);
		
		// Flush block to output
		for(i = 0; i < 16; i++){
			output[j * 16 + i] = B[i];
		}
	}
	
	// Read output into ciphertext
	var ciphertext = '';
	for(i = 0, il = output.length; i < il; i++){
		ciphertext += ('00' + output[i].toString(16)).slice(-2);
	}
	
	return ciphertext;
};


/**
 * ECB DECRYPTION
 *
 * @param {string} ciphertext
 * @param {string} key 64 char hexadecimal
 * @return {string} plaintext
 */
camellia.ecb.decrypt = function(ciphertext, key){
	
	// Param validation
	if(typeof ciphertext != 'string' || !(new RegExp('[0123456789abcdef]{' + ciphertext.length + '}', 'gi')).test(ciphertext)){
		console.error('ciphertext must be n-byte hexadecimal string');
		return 0;
	}
	
	if(typeof key != 'string' || key.length != 64 || !(/[0123456789abcdef]{64}/gi).test(key)){
		console.error('key parameter must be 32-byte hexadecimal string');
		return 0;
	}
	
	// Blockchain byte size equal to half ciphertext length
	var byte_length = ciphertext.length / 2;
	var output = new Uint8Array(byte_length);
	var blockchain = new Uint8Array(byte_length);
	
	// Read ciphertext hexadecimal byte representations into blockchain
	for(var i = 0, il = blockchain.length; i < il; i++){
		blockchain[i] = parseInt(ciphertext.slice(2 * i, 2 * (i + 1)), 16);
	}
	
	// Key Expansions
	var k = new Uint8Array(32);
	for(i = 0; i < 32; i++){
		k[i] = parseInt(key.slice(2 * i, 2 * (i + 1)), 16);
	}
	var expanded_key = camellia.keyschedule(k);
	
	// Decryption loop
	for(var j = 0, jl = blockchain.length / 16; j < jl; j++){
		
		// Temporary variable B for each block
		var B = blockchain.slice(j * 16, (j + 1) * 16);
		
		// Block Cipher Decryption
		B = camellia.inverse_cipher(B, expanded_key);
		
		// Flush block to output
		for(i = 0; i < 16; i++){
			output[j * 16 + i] = B[i];
		}
	}
	
	// Read output into encoded plaintext
	var plaintext = '';
	for(i = 0, il = output.length; i < il; i++){
		plaintext += String.fromCharCode(output[i]);
	}
	
	// Decode plaintext and remove trailing whitespace characters
	plaintext = decodeURIComponent(escape(plaintext));
	plaintext = plaintext.trim();
	
	return plaintext;
};


/**
 * CBC ENCRYPTION
 *
 * @param {string} plaintext
 * @param {string} key 64 char hexadecimal
 * @return {string} ciphertext
 */
camellia.cbc.encrypt = function(plaintext, key){
	
	// Param validation
	if(typeof plaintext != 'string'){
		console.error('plaintext parameter must be a string');
		return 0;
	}

	if(typeof key != 'string' || key.length != 64 || !(/[0123456789abcdef]{64}/gi).test(key)){
		console.error('key parameter must be 32-byte hexadecimal string');
		return 0;
	}

	// Encode special characters into single-byte characters
	var plaintext = unescape(encodeURIComponent(plaintext));
	
	// Pad plaintext with whitespace characters
	while(plaintext.length % 16 !== 0){
		plaintext += ' ';
	}
	
	// Blockchain byte size equal to plaintext length
	var output = new Uint8Array(plaintext.length);
	var blockchain = new Uint8Array(plaintext.length);
	
	// Read plaintext character byte values into blockchain
	for(var i = 0, il = plaintext.length; i < il; i++){
		blockchain[i] = plaintext.charCodeAt(i);
	}
	
	// Key Expansions
	var k = new Uint8Array(32);
	for(i = 0; i < 32; i++){
		k[i] = parseInt(key.slice(2 * i, 2 * (i + 1)), 16);
	}
	var expanded_key = camellia.keyschedule(k);
	
	// Initialisation Vector
	var IV = new Uint8Array(16);
	for(i = 0; i < 16; i++){
		IV[i] = Math.floor(Math.random() * 256);
	}
	
	// Encryption loop
	for(var j = 0, jl = blockchain.length / 16, B; j < jl; j++){
		
		// XOR first block with IV
		if(j == 0){
			B = blockchain.slice(0, 16);
			for(i = 0; i < 16; i++){
				B[i] ^= IV[i];
			}
		}else{
			for(i = 0; i < 16; i++){
				B[i] ^= blockchain[j * 16 + i];
			}
		}
		
		// Block Cipher Encryption
		B = camellia.cipher(B, expanded_key);
		
		// Flush block to output
		for(i = 0; i < 16; i++){
			output[j * 16 + i] = B[i];
		}
	}
	
	// Read output into ciphertext
	var ciphertext = '';
	for(i = 0; i < 16; i++){
		ciphertext += ('00' + IV[i].toString(16)).slice(-2);
	}
	for(i = 0, il = output.length; i < il; i++){
		ciphertext += ('00' + output[i].toString(16)).slice(-2);
	}
	
	return ciphertext;
};


/**
 * CBC DECRYPTION
 *
 * @param {string} ciphertext
 * @param {string} key 64 char hexadecimal
 * @return {string} plaintext
 */
camellia.cbc.decrypt = function(ciphertext, key){
	
	// Param validation
	if(typeof ciphertext != 'string' || !(new RegExp('[0123456789abcdef]{' + ciphertext.length + '}', 'gi')).test(ciphertext)){
		console.error('ciphertext must be n-byte hexadecimal string');
		return 0;
	}
	
	if(typeof key != 'string' || key.length != 64 || !(/[0123456789abcdef]{64}/gi).test(key)){
		console.error('key parameter must be 32-byte hexadecimal string');
		return 0;
	}
	
	// Blockchain byte size equal to half ciphertext length
	var byte_length = ciphertext.length / 2;
	var output = new Uint8Array(byte_length - 16);
	var blockchain = new Uint8Array(byte_length);
	
	// Read ciphertext hexadecimal byte representations into blockchain
	for(var i = 0, il = blockchain.length; i < il; i++){
		blockchain[i] = parseInt(ciphertext.slice(2 * i, 2 * (i + 1)), 16);
	}
	
	// Key Expansions
	var k = new Uint8Array(32);
	for(i = 0; i < 32; i++){
		k[i] = parseInt(key.slice(2 * i, 2 * (i + 1)), 16);
	}
	var expanded_key = camellia.keyschedule(k);
	
	// Decryption loop
	for(var j = 1, jl = blockchain.length / 16; j < jl; j++){
		
		// Temporary variable B for each block
		var B = blockchain.slice(j * 16, (j + 1) * 16);
		
		// Block Cipher Decryption
		B = camellia.inverse_cipher(B, expanded_key);
		
		// XOR with previous block in ciphertext
		var A = blockchain.slice((j - 1) * 16, j * 16);
		for(i = 0; i < 16; i++){
			B[i] ^= A[i];
		}
		
		// Flush block to output
		for(i = 0; i < 16; i++){
			output[(j - 1) * 16 + i] = B[i];
		}
	}

	// Read output into encoded plaintext
	var plaintext = '';
	for(i = 0, il = output.length; i < il; i++){
		plaintext += String.fromCharCode(output[i]);
	}
	
	// Decode plaintext and remove trailing whitespace characters
	plaintext = decodeURIComponent(escape(plaintext));
	plaintext = plaintext.trim();
	
	return plaintext;
};


/**
 * CTR ENCRYPTION
 *
 * @param {string} plaintext
 * @param {string} key 64 char hexadecimal
 * @return {string} ciphertext
 */
camellia.ctr.encrypt = function(plaintext, key){
	
	// Param validation
	if(typeof plaintext != 'string'){
		console.error('plaintext parameter must be a string');
		return 0;
	}

	if(typeof key != 'string' || key.length != 64 || !(/[0123456789abcdef]{64}/gi).test(key)){
		console.error('key parameter must be 32-byte hexadecimal string');
		return 0;
	}

	// Encode special characters into single-byte characters
	var plaintext = unescape(encodeURIComponent(plaintext));
	
	// Pad plaintext with whitespace characters
	while(plaintext.length % 16 !== 0){
		plaintext += ' ';
	}
	
	// Blockchain byte size equal to plaintext length
	var output = new Uint8Array(plaintext.length);
	var blockchain = new Uint8Array(plaintext.length);
	
	// Read plaintext character byte values into blockchain
	for(var i = 0, il = plaintext.length; i < il; i++){
		blockchain[i] = plaintext.charCodeAt(i);
	}
	
	// Key Expansions
	var k = new Uint8Array(32);
	for(i = 0; i < 32; i++){
		k[i] = parseInt(key.slice(2 * i, 2 * (i + 1)), 16);
	}
	var expanded_key = camellia.keyschedule(k);
	
	// Initialise Nonce
	var nonce = new Uint8Array(8);
	for(i = 0; i < 8; i++){
		nonce[i] = Math.floor(Math.random() * 256);
	}
	
	// Encryption loop
	for(var j = 0, jl = blockchain.length / 16; j < jl; j++){
		
		//Temporary variable B for each block
		var B = new Uint8Array(16);
		var counter = ('0000000000000000' + j.toString(16)).slice(-16);
		for(i = 0; i < 8; i++){
			B[i] = nonce[i];
		}
		for(i = 0; i < 8; i++){
			B[i + 8] = parseInt(counter.slice(i * 2, (i + 1) * 2), 16);
		}
		
		// Block Cipher Encryption
		B = camellia.cipher(B, expanded_key);
		
		// XOR B with block
		var A = blockchain.slice(j * 16, (j + 1) * 16);
		for(i = 0; i < 16; i++){
			B[i] ^= A[i];
		}
		
		// Flush block to output
		for(i = 0; i < 16; i++){
			output[j * 16 + i] = B[i];
		}
	}
	
	// Read output into ciphertext
	var ciphertext = '';
	for(i = 0; i < 8; i++){
		ciphertext += ('00' + nonce[i].toString(16)).slice(-2);
	}
	for(i = 0, il = output.length; i < il; i++){
		ciphertext += ('00' + output[i].toString(16)).slice(-2);
	}
	
	return ciphertext;
};


/**
 * CTR DECRYPTION
 *
 * @param {string} ciphertext
 * @param {string} key 64 char hexadecimal
 * @return {string} plaintext
 */
camellia.ctr.decrypt = function(ciphertext, key){
	
	// Param validation
	if(typeof ciphertext != 'string' || !(new RegExp('[0123456789abcdef]{' + ciphertext.length + '}', 'gi')).test(ciphertext)){
		console.error('ciphertext must be n-byte hexadecimal string');
		return 0;
	}
	
	if(typeof key != 'string' || key.length != 64 || !(/[0123456789abcdef]{64}/gi).test(key)){
		console.error('key parameter must be 32-byte hexadecimal string');
		return 0;
	}
	
	// Separate nonce from ciphertext
	var nonce = new Uint8Array(8);
	for(var i = 0; i < 8; i++){
		nonce[i] = parseInt(ciphertext.slice(i * 2, (i + 1) * 2), 16);
	}
	ciphertext = ciphertext.slice(16);
	
	// Blockchain byte size equal to half ciphertext length
	var byte_length = ciphertext.length / 2;
	var output = new Uint8Array(byte_length);
	var blockchain = new Uint8Array(byte_length);
	
	// Read ciphertext hexadecimal byte representations into blockchain
	for(i = 0, il = blockchain.length; i < il; i++){
		blockchain[i] = parseInt(ciphertext.slice(2 * i, 2 * (i + 1)), 16);
	}
	
	// Key Expansions
	var k = new Uint8Array(32);
	for(i = 0; i < 32; i++){
		k[i] = parseInt(key.slice(2 * i, 2 * (i + 1)), 16);
	}
	var expanded_key = camellia.keyschedule(k);
	
	// Decryption loop
	for(var j = 0, jl = blockchain.length / 16; j < jl; j++){
		
		//Temporary variable B for each block
		var B = new Uint8Array(16);
		var counter = ('0000000000000000' + j.toString(16)).slice(-16);
		for(i = 0; i < 8; i++){
			B[i] = nonce[i];
		}
		for(i = 0; i < 8; i++){
			B[i + 8] = parseInt(counter.slice(i * 2, (i + 1) * 2), 16);
		}
		
		// Block Cipher Encryption
		B = camellia.cipher(B, expanded_key);
		
		// XOR B with block
		var A = blockchain.slice(j * 16, (j + 1) * 16);
		for(i = 0; i < 16; i++){
			B[i] ^= A[i];
		}
		
		// Flush block to output
		for(i = 0; i < 16; i++){
			output[j * 16 + i] = B[i];
		}
	}
	
	// Read output into encoded plaintext
	var plaintext = '';
	for(i = 0, il = output.length; i < il; i++){
		plaintext += String.fromCharCode(output[i]);
	}
	
	// Decode plaintext and remove trailing whitespace characters
	plaintext = decodeURIComponent(escape(plaintext));
	plaintext = plaintext.trim();
	
	return plaintext;
};


/**
 * BLOCK CIPHER
 *
 * @param {number[]} block Uint8Array(16)
 * @param {object} key (expanded)
 * @return {number[]} ciphertext Uint8Array(16)
 */
camellia.cipher = function(block, key){
	
	// Prewhitening
	for(var i = 0; i < 8; i++) block[i] ^= key.kw[1][i];
	for(i = 0; i < 8; i++) block[i + 8] ^= key.kw[2][i];
	
	// Feistel Rounds 1 - 6
	for(i = 1; i < 7; i++) {block = camellia.round(block, key.k[i]);}
	
	// FL Transformation #1
	var T = [block.slice(0, 8), block.slice(8, 16)];
	T[0] = camellia.fl(T[0], key.kl[1]);
	T[1] = camellia.inverse_fl(T[1], key.kl[2]);
	for(i = 0; i < 8; i++) block[i] = T[0][i];
	for(i = 0; i < 8; i++) block[i + 8] = T[1][i];
	
	// Feistel Rounds 7 - 12
	for(i = 7; i < 13; i++) {block = camellia.round(block, key.k[i]);}
	
	// FL Transformation #2
	T = [block.slice(0, 8), block.slice(8, 16)];
	T[0] = camellia.fl(T[0], key.kl[3]);
	T[1] = camellia.inverse_fl(T[1], key.kl[4]);
	for(i = 0; i < 8; i++) block[i] = T[0][i];
	for(i = 0; i < 8; i++) block[i + 8] = T[1][i];
	
	// Feistel Rounds 13 - 18
	for(i = 13; i < 19; i++) {block = camellia.round(block, key.k[i]);}
	
	// FL Transformation #3
	T = [block.slice(0, 8), block.slice(8, 16)];
	T[0] = camellia.fl(T[0], key.kl[5]);
	T[1] = camellia.inverse_fl(T[1], key.kl[6]);
	for(i = 0; i < 8; i++) block[i] = T[0][i];
	for(i = 0; i < 8; i++) block[i + 8] = T[1][i];
	
	// Feistel Rounds 19 - 24
	for(i = 19; i < 25; i++) {block = camellia.round(block, key.k[i]);}
	
	// R || L
	block = block.left(64);
	
	// Postwhitening
	for(i = 0; i < 8; i++) block[i] ^= key.kw[3][i];
	for(i = 0; i < 8; i++) block[i + 8] ^= key.kw[4][i];
	
	return block;
};

camellia.inverse_cipher = function(block, key){
	
	// Postwhitening
	for(var i = 0; i < 8; i++) block[i] ^= key.kw[3][i];
	for(i = 0; i < 8; i++) block[i + 8] ^= key.kw[4][i];
	
	// Feistel Rounds 24 - 19
	for(i = 24; i > 18; i--) block = camellia.round(block, key.k[i]);
	
	// FL Transformation #3
	var T = [block.slice(0, 8), block.slice(8, 16)];
	T[0] = camellia.fl(T[0], key.kl[6]);
	T[1] = camellia.inverse_fl(T[1], key.kl[5]);
	for(i = 0; i < 8; i++) block[i] = T[0][i];
	for(i = 0; i < 8; i++) block[i + 8] = T[1][i];
	
	// Feistel Rounds 18 - 13
	for(i = 18; i > 12; i--) block = camellia.round(block, key.k[i]);
	
	// FL Transformation #2
	T = [block.slice(0, 8), block.slice(8, 16)];
	T[0] = camellia.fl(T[0], key.kl[4]);
	T[1] = camellia.inverse_fl(T[1], key.kl[3]);
	for(i = 0; i < 8; i++) block[i] = T[0][i];
	for(i = 0; i < 8; i++) block[i + 8] = T[1][i];
	
	// Feistel Rounds 12 - 7
	for(i = 12; i > 6; i--) block = camellia.round(block, key.k[i]);
	
	// FL Transformation #1
	T = [block.slice(0, 8), block.slice(8, 16)];
	T[0] = camellia.fl(T[0], key.kl[2]);
	T[1] = camellia.inverse_fl(T[1], key.kl[1]);
	for(i = 0; i < 8; i++) block[i] = T[0][i];
	for(i = 0; i < 8; i++) block[i + 8] = T[1][i];
	
	// Feistel Rounds 6 - 1
	for(i = 6; i > 0; i--) block = camellia.round(block, key.k[i]);
	
	// L || R
	block = block.left(64);
	
	// Postwhitening
	for(i = 0; i < 8; i++) block[i] ^= key.kw[1][i];
	for(i = 0; i < 8; i++) block[i + 8] ^= key.kw[2][i];
	
	return block;
};


/**
 * KEY SCHEDULE
 *
 * @param {number[]} K Uint8Array(32)
 * @return {object} expanded key
 */
camellia.keyschedule = function(K){
	
	// Split K into Left and Right halves
	var KL = K.slice(0, 16);
	var KR = K.slice(16);
	
	// Generate key schedule variables
	var KA, KB = new Uint8Array(16);
	for(var i = 0; i < 16; i++) KB[i] = KL[i] ^ KR[i];
	KB = camellia.round(KB, camellia.sigma[1]);
	KB = camellia.round(KB, camellia.sigma[2]);
	for(i = 0; i < 16; i++) KB[i] ^= KL[i];
	KB = camellia.round(KB, camellia.sigma[3]);
	KB = camellia.round(KB, camellia.sigma[4]);
	KA = KB.slice();
	for(i = 0; i < 16; i++) KB[i] ^= KR[i];
	KB = camellia.round(KB, camellia.sigma[5]);
	KB = camellia.round(KB, camellia.sigma[6]);
	
	// Construct key object
	var key = {};
	key.kw = {
		"1": KL.slice(0, 8),
		"2": KL.slice(8, 16),
		"3": KB.left(111).slice(0, 8),
		"4": KB.left(111).slice(8, 16)
	};
	key.kl = {
		"1": KR.left(30).slice(0, 8),
		"2": KR.left(30).slice(8, 16),
		"3": KL.left(60).slice(0, 8),
		"4": KL.left(60).slice(8, 16),
		"5": KA.left(77).slice(0, 8),
		"6": KA.left(77).slice(8, 16)
	};
	key.k = {
		"1": KB.slice(0, 8),
		"2": KB.slice(8, 16),
		"3": KR.left(15).slice(0, 8),
		"4": KR.left(15).slice(8, 16),
		"5": KA.left(15).slice(0, 8),
		"6": KA.left(15).slice(8, 16),
		"7": KB.left(30).slice(0, 8),
		"8": KB.left(30).slice(8, 16),
		"9": KL.left(45).slice(0, 8),
		"10": KL.left(45).slice(8, 16),
		"11": KA.left(45).slice(0, 8),
		"12": KA.left(45).slice(8, 16),
		"13": KR.left(60).slice(0, 8),
		"14": KR.left(60).slice(8, 16),
		"15": KB.left(60).slice(0, 8),
		"16": KB.left(60).slice(8, 16),
		"17": KL.left(77).slice(0, 8),
		"18": KL.left(77).slice(8, 16),
		"19": KR.left(94).slice(0, 8),
		"20": KR.left(94).slice(8, 16),
		"21": KA.left(94).slice(0, 8),
		"22": KA.left(94).slice(8, 16),
		"23": KL.left(111).slice(0, 8),
		"24": KL.left(111).slice(8, 16)
	};
	
	return key;
};

// Key Schedule Constants
camellia.sigma = {
	"1": new Uint8Array([0xA0, 0x9E, 0x66, 0x7F, 0x3B, 0xCC, 0x90, 0x8B]),
	"2": new Uint8Array([0xB6, 0x7A, 0xE8, 0x58, 0x4C, 0xAA, 0x73, 0xB2]),
	"3": new Uint8Array([0xC6, 0xEF, 0x37, 0x2F, 0xE9, 0x4F, 0x82, 0xBE]),
	"4": new Uint8Array([0x54, 0xFF, 0x53, 0xA5, 0xF1, 0xD3, 0x6F, 0x1C]),
	"5": new Uint8Array([0x10, 0xE5, 0x27, 0xFA, 0xDE, 0x68, 0x2D, 0x1D]),
	"6": new Uint8Array([0xB0, 0x56, 0x88, 0xC2, 0xB3, 0xE6, 0xC1, 0xFD])
};


/**
 * BLOCK CIPHER SINGLE ROUND
 *
 * @param {number[]} X Uint8Array(16)
 * @param {number[]} k Uint8Array(8)
 * @return {number[]} ciphertext Uint8Array(16)
 */
camellia.round = function(X, k){
	var L = X.slice(0, 8);
	var R = X.slice(8);
	X = X.map((e, i, a) => a[(i + 8) % 16]);
	L = camellia.f(L, k);
	for(var i = 0; i < 8; i++){
		L[i] ^= R[i];
		X[i] = L[i];
	}
	return X;
};


/**
 * INVERSE FL-FUNCTION
 * @private
 */
camellia.inverse_fl = function(X, k){
	var R = new Uint8Array(8);
	var T = new Uint8Array(4);
	for(var i = 0; i < 4; i++) R[i] = (X[i + 4] | k[i + 4]) ^ X[i];
	for(i = 0; i < 4; i++) T[i] = R[i] & k[i];
	T = T.left(1);
	for(i = 0; i < 4; i++) R[i + 4] = T[i] ^ X[i + 4];
	return R;
};


/**
 * FL-FUNCTION
 * @private
 */
camellia.fl = function(X, k){
	var R = new Uint8Array(8);
	var T = new Uint8Array(4);
	for(var i = 0; i < 4; i++) T[i] = X[i] & k[i];
	T = T.left(1);
	for(i = 0; i < 4; i++) R[i + 4] = T[i] ^ X[i + 4];
	for(i = 0; i < 4; i++) R[i] = (R[i + 4] | k[i + 4]) ^ X[i];
	return R;
};


/**
 * F-FUNCTION
 * @private
 */
camellia.f = function(X, k){
	var T = new Uint8Array(8);
	for(var i = 0; i < 8; i++){
		T[i] = X[i] ^ k[i];
	}
	return camellia.p(camellia.sbox.core(T));
};


/**
 * P-FUNCTION
 * @private
 */
camellia.p = function(L){
	var T = new Uint8Array(8);
	T[0] = L[0] ^ L[2] ^ L[3] ^ L[5] ^ L[6] ^ L[7];
	T[1] = L[0] ^ L[1] ^ L[3] ^ L[4] ^ L[6] ^ L[7];
	T[2] = L[0] ^ L[1] ^ L[2] ^ L[4] ^ L[5] ^ L[7];
	T[3] = L[1] ^ L[2] ^ L[3] ^ L[4] ^ L[5] ^ L[6];
	T[4] = L[0] ^ L[1] ^ L[5] ^ L[6] ^ L[7];
	T[5] = L[1] ^ L[2] ^ L[4] ^ L[6] ^ L[7];
	T[6] = L[2] ^ L[3] ^ L[4] ^ L[5] ^ L[7];
	T[7] = L[0] ^ L[3] ^ L[4] ^ L[5] ^ L[6];
	return T;
};


/**
 * S-FUNCTION
 * @private
 */
camellia.sbox.core = function(L){
	return (new Uint8Array([camellia.sbox[1][L[0]], camellia.sbox[2][L[1]], camellia.sbox[3][L[2]], camellia.sbox[4][L[3]], camellia.sbox[2][L[4]], camellia.sbox[3][L[5]], camellia.sbox[4][L[6]], camellia.sbox[1][L[7]]]));
};

// S-Box Constants
camellia.sbox[1] = new Uint8Array([112, 130, 44, 236, 179, 39, 192, 229, 228, 133, 87, 53, 234, 12, 174, 65, 35, 239, 107, 147, 69, 25, 165, 33, 237, 14, 79, 78, 29, 101, 146, 189, 134, 184, 175, 143, 124, 235, 31, 206, 62, 48, 220, 95, 94, 197, 11, 26, 166, 225, 57, 202, 213, 71, 93, 61, 217, 1, 90, 214, 81, 86, 108, 77, 139, 13, 154, 102, 251, 204, 176, 45, 116, 18, 43, 32, 240, 177, 132, 153, 223, 76, 203, 194, 52, 126, 118, 5, 109, 183, 169, 49, 209, 23, 4, 215, 20, 88, 58, 97, 222, 27, 17, 28, 50, 15, 156, 22, 83, 24, 242, 34, 254, 68, 207, 178, 195, 181, 122, 145, 36, 8, 232, 168, 96, 252, 105, 80, 170, 208, 160, 125, 161, 137, 98, 151, 84, 91, 30, 149, 224, 255, 100, 210, 16, 196, 0, 72, 163, 247, 117, 219, 138, 3, 230, 218, 9, 63, 221, 148, 135, 92, 131, 2, 205, 74, 144, 51, 115, 103, 246, 243, 157, 127, 191, 226, 82, 155, 216, 38, 200, 55, 198, 59, 129, 150, 111, 75, 19, 190, 99, 46, 233, 121, 167, 140, 159, 110, 188, 142, 41, 245, 249, 182, 47, 253, 180, 89, 120, 152, 6, 106, 231, 70, 113, 186, 212, 37, 171, 66, 136, 162, 141, 250, 114, 7, 185, 85, 248, 238, 172, 10, 54, 73, 42, 104, 60, 56, 241, 164, 64, 40, 211, 123, 187, 201, 67, 193, 21, 227, 173, 244, 119, 199, 128, 158]);

camellia.sbox[2] = camellia.sbox[1].map(e => (e << 1) | (e >> 7));

camellia.sbox[3] = camellia.sbox[1].map(e => (e << 7) | (e >> 1));

camellia.sbox[4] = camellia.sbox[1].map((e, i, a) => a[((i << 1) | (i >> 7)) % 256]);


/**
 * TypedArray Utils
 */
 
// Left n-bit bitwise rotation
Uint8Array.prototype.left = function(n){
	var T = this.slice();
	for(var j = 0; j < n; j++){
		T = T.map((e, i, a) => (e << 1) | (a[(i + 1) % a.length] >> 7));
	}
	return T;
};

if(typeof module != 'undefined') module.exports = camellia;