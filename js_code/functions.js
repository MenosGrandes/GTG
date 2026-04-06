

// Function to reverse a string
function reverseString(str) {
  return str.split('').reverse().join('');
}

// Function to find the maximum number in an array
function getMaxNumber(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return Math.max(...arr);
}

// Function to find the minimum number in an array
function getMinNumber(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return Math.min(...arr);
}

// Function to count occurrences of a value in an array
function countOccurrences(arr, value) {
  return arr.reduce((count, item) => {
    return item === value ? count + 1 : count;
  }, 0);
}

// Function to flatten a nested array (one level deep)
function flattenArray(arr) {
  return arr.reduce((acc, item) => {
    return acc.concat(Array.isArray(item) ? item : [item]);
  }, []);
}

// Function to remove duplicates from an array
function uniqueArray(arr) {
  return [...new Set(arr)];
}

// Function to check if a value is "empty" (string, array, object)
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// Function to validate email format (basic regex)
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to calculate days between two dates
function getDaysBetweenDates(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Function to group array of objects by a specific key
function groupBy(arr, key) {
  return arr.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

// Function to pick specific keys from an object
function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

// Function to omit specific keys from an object
function omit(obj, keys) {
  return Object.keys(obj).reduce((result, key) => {
    if (!keys.includes(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

// Function to convert camelCase to snake_case
function camelToSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Function to convert snake_case to camelCase
function snakeToCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Function to get current Unix timestamp (in seconds)
function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

// Function to pad a number with leading zeros
function padNumber(num, size) {
  const str = Math.abs(num).toString();
  const padded = str.padStart(size, '0');
  return num < 0 ? '-' + padded : padded;
}

// Function to truncate a string to max length with suffix
function truncateString(str, maxLength, suffix = '...') {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

// Function to clamp a number between min and max
function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

// Function to generate a random integer in range [min, max] (inclusive)
function randomInRange(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

// Function to attempt calling a function multiple times on error (sync version)
function attempt(fn, maxAttempts = 3, ...args) {
  let lastError;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return fn(...args);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function returnPowerOf(base, exp = 2) {
  return Math.pow(base, exp);
}

function getOccurencesOfChar(char, str) {
  return [...str].filter(c => c === char).length;
}

function isOdd(num) {
  return num % 2 !== 0;
}

function concatenateArrays(arr1, arr2) {
  return [...arr1, ...arr2];
}

function capitalizeWords(str) {
  return str.split('').map(c => c.toUpperCase()).join('');
}

function calculateAverage(numbers) {
  return numbers.reduce((acc, n) => acc + n, 0) / numbers.length;
}

function containsSubstring(str, sub) {
  return str.includes(sub);
}

function sortNumbersAscending(arr) {
  return [...arr].sort((a, b) => a - b);
}

function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function removeWhitespace(str) {
  return str.replace(/\s/g, '');
}

function arrayContainsElement(arr, el) {
  return arr.includes(el);
}

function isPositive(num) {
  return num > 0;
}

function sumArray(numbers) {
  return numbers.reduce((acc, n) => acc + n, 0);
}

function findMax(arr) {
  return Math.max(...arr);
}

function replaceSubstring(str, oldSub, newSub) {
  return str.split(oldSub).join(newSub);
}

function sortStringsAlphabetically(arr) {
  return [...arr].sort();
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isNegative(num) {
  return num < 0;
}

function removeDuplicates(arr) {
  return [...new Set(arr)];
}

function toLowerCase(str) {
  return str.toLowerCase();
}

function getEvenNumbers(start, end) {
  let count = 0;
  for (let i = start; i <= end; i++) {
    if (i % 2 === 0) count++;
  }
  return count;
}

function moveVector(x, y, scalar) {
  return { x: x + scalar, y: y + scalar };
}

function arrayFunction(i) {
  return () => i % 2 === 0 ? 'Is even' : 'Not even';
}

function switchFunction(val) {
  if (typeof val === 'function') return val();
  if (typeof val === 'number') return 'numb';
  if (typeof val === 'boolean') return 'bool';
  if (typeof val === 'string') return 'str';
}

function fibonacci(n) {
  if (n === 0) return 0;
  if (n === 1) return 1;
  let a = 0n, b = 1n;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(b) : b;
}

function factorialize(n) {
  if (n <= 1) return 1;
  let result = 1n;
  for (let i = 2n; i <= BigInt(n); i++) result *= i;
  return result <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(result) : result;
}

function convertFtoC(f) {
  return (f - 32) * 5 / 9;
}

function isPalindrome(str) {
  return str === str.split('').reverse().join('');
}

function isPrime(n) {
  if (n <= 1) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function gcd(a, b) {
  while (b !== 0) { [a, b] = [b, a % b]; }
  return Math.abs(a);
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function sumDigits(n) {
  return String(n).split('').reduce((acc, d) => acc + Number(d), 0);
}

function countWords(str) {
  return str.trim() === '' ? 0 : str.trim().split(/\s+/).length;
}

function titleCase(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function repeatString(str, n) {
  return n <= 0 ? '' : str.repeat(n);
}

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function zipArrays(arr1, arr2) {
  const len = Math.min(arr1.length, arr2.length);
  return Array.from({ length: len }, (_, i) => [arr1[i], arr2[i]]);
}

function intersection(arr1, arr2) {
  const set2 = new Set(arr2);
  return [...new Set(arr1.filter(x => set2.has(x)))];
}

function difference(arr1, arr2) {
  const set2 = new Set(arr2);
  return [...new Set(arr1.filter(x => !set2.has(x)))];
}

function rotateArray(arr, k) {
  if (arr.length === 0) return [];
  const n = arr.length;
  const shift = ((k % n) + n) % n;
  return [...arr.slice(n - shift), ...arr.slice(0, n - shift)];
}

function invertObject(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
}

function toBinary(n) {
  return n.toString(2);
}

function fromBinary(str) {
  return parseInt(str, 2);
}

function numberToRoman(num) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
  }
  return result;
}

function toCurrency(amount, currency) {
  return amount.toFixed(2) + ' ' + currency;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function flattenDeep(arr) {
  return arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flattenDeep(val) : val), []);
}

class BankAccount {
  constructor(owner, initialBalance = 0) {
    this._owner = owner;
    this._balance = initialBalance;
  }
  getOwner() { return this._owner; }
  getBalance() { return this._balance; }
  deposit(amount) {
    if (amount > 0) this._balance += amount;
  }
  withdraw(amount) {
    if (amount > this._balance) return false;
    this._balance -= amount;
    return true;
  }
}

class Stack {
  constructor() { this._items = []; }
  push(item) { this._items.push(item); }
  pop() { return this._items.pop(); }
  peek() { return this._items[this._items.length - 1]; }
  isEmpty() { return this._items.length === 0; }
  size() { return this._items.length; }
}

class EventEmitter {
  constructor() { this._listeners = {}; }
  on(event, listener) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(listener);
  }
  emit(event, ...args) {
    if (!this._listeners[event] || this._listeners[event].length === 0) return false;
    this._listeners[event].forEach(l => l(...args));
    return true;
  }
  off(event, listener) {
    if (!this._listeners[event]) return;
    const idx = this._listeners[event].indexOf(listener);
    if (idx !== -1) this._listeners[event].splice(idx, 1);
  }
  listenerCount(event) {
    return this._listeners[event] ? this._listeners[event].length : 0;
  }
}

class LinkedList {
  constructor() { this._head = null; this._size = 0; }
  append(value) {
    const node = { value, next: null };
    if (!this._head) { this._head = node; }
    else {
      let cur = this._head;
      while (cur.next) cur = cur.next;
      cur.next = node;
    }
    this._size++;
  }
  prepend(value) {
    this._head = { value, next: this._head };
    this._size++;
  }
  delete(value) {
    if (!this._head) return false;
    if (this._head.value === value) { this._head = this._head.next; this._size--; return true; }
    let cur = this._head;
    while (cur.next) {
      if (cur.next.value === value) { cur.next = cur.next.next; this._size--; return true; }
      cur = cur.next;
    }
    return false;
  }
  toArray() {
    const result = [];
    let cur = this._head;
    while (cur) { result.push(cur.value); cur = cur.next; }
    return result;
  }
  size() { return this._size; }
}

class ObservableValue {
  constructor(initialValue) { this._value = initialValue; this._subscribers = []; }
  get() { return this._value; }
  set(newValue) {
    if (newValue === this._value) return;
    const old = this._value;
    this._value = newValue;
    this._subscribers.forEach(fn => fn(newValue, old));
  }
  subscribe(listener) {
    this._subscribers.push(listener);
    return () => { this._subscribers = this._subscribers.filter(fn => fn !== listener); };
  }
  subscriberCount() { return this._subscribers.length; }
}

class LRUCache {
  constructor(capacity) { this._capacity = capacity; this._map = new Map(); }
  get(key) {
    if (!this._map.has(key)) return -1;
    const val = this._map.get(key);
    this._map.delete(key);
    this._map.set(key, val);
    return val;
  }
  put(key, value) {
    if (this._map.has(key)) this._map.delete(key);
    this._map.set(key, value);
    if (this._map.size > this._capacity) this._map.delete(this._map.keys().next().value);
  }
  size() { return this._map.size; }
}

class ShoppingCart {
  constructor() { this._items = new Map(); this._discount = 0; }
  addItem(id, name, price, quantity) {
    if (this._items.has(id)) {
      this._items.get(id).quantity += quantity;
    } else {
      this._items.set(id, { id, name, price, quantity });
    }
  }
  removeItem(id) {
    if (!this._items.has(id)) return false;
    this._items.delete(id);
    return true;
  }
  updateQuantity(id, quantity) {
    if (quantity <= 0) { this._items.delete(id); return; }
    if (this._items.has(id)) this._items.get(id).quantity = quantity;
  }
  getTotal() {
    let total = 0;
    for (const item of this._items.values()) total += item.price * item.quantity;
    return total * (1 - this._discount / 100);
  }
  applyDiscount(percent) { this._discount = percent; }
  getItemCount() {
    let count = 0;
    for (const item of this._items.values()) count += item.quantity;
    return count;
  }
}

class UserValidator {
  validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
  validatePassword(password) {
    const errors = [];
    if (password.length < 8) errors.push('min 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('requires uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('requires lowercase letter');
    if (!/\d/.test(password)) errors.push('requires digit');
    return { valid: errors.length === 0, errors };
  }
  validateUsername(username) { return /^[a-zA-Z0-9_]{3,20}$/.test(username); }
  validateRegistration({ email, password, username }) {
    const errors = [];
    if (!this.validateEmail(email)) errors.push({ field: 'email', message: 'Invalid email' });
    const pw = this.validatePassword(password);
    if (!pw.valid) errors.push({ field: 'password', message: pw.errors.join(', ') });
    if (!this.validateUsername(username)) errors.push({ field: 'username', message: 'Invalid username' });
    return { valid: errors.length === 0, errors };
  }
}

class TaskManager {
  constructor() { this._tasks = []; this._nextId = 1; }
  addTask(title, priority) {
    const task = { id: this._nextId++, title, priority, completed: false };
    this._tasks.push(task);
    return task;
  }
  completeTask(id) {
    const t = this._tasks.find(t => t.id === id);
    if (!t) return false;
    t.completed = true;
    return true;
  }
  deleteTask(id) {
    const idx = this._tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this._tasks.splice(idx, 1);
    return true;
  }
  getByPriority(priority) { return this._tasks.filter(t => t.priority === priority && !t.completed); }
  getSummary() {
    const completed = this._tasks.filter(t => t.completed).length;
    return { total: this._tasks.length, completed, pending: this._tasks.length - completed };
  }
}

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this._max = maxRequests;
    this._windowMs = windowMs;
    this._clients = new Map();
  }
  _getClient(clientId) {
    const now = Date.now();
    if (!this._clients.has(clientId) || now - this._clients.get(clientId).start >= this._windowMs) {
      this._clients.set(clientId, { count: 0, start: now });
    }
    return this._clients.get(clientId);
  }
  tryRequest(clientId) {
    const c = this._getClient(clientId);
    if (c.count >= this._max) return false;
    c.count++;
    return true;
  }
  getRemainingRequests(clientId) {
    const c = this._getClient(clientId);
    return Math.max(0, this._max - c.count);
  }
  reset(clientId) { this._clients.delete(clientId); }
}

class Pipeline {
  constructor(steps = []) { this._steps = steps; }
  pipe(fn) { this._steps.push(fn); return this; }
  execute(input) { return this._steps.reduce((v, fn) => fn(v), input); }
  clone() { return new Pipeline([...this._steps]); }
  stepCount() { return this._steps.length; }
}

class StateMachine {
  constructor(initialState, transitions) {
    this._state = initialState;
    this._transitions = transitions;
    this._listeners = [];
  }
  getState() { return this._state; }
  dispatch(event) {
    const t = this._transitions.find(t => t.from === this._state && t.event === event);
    if (!t) return false;
    const from = this._state;
    this._state = t.to;
    this._listeners.forEach(fn => fn(from, event, t.to));
    return true;
  }
  canDispatch(event) { return this._transitions.some(t => t.from === this._state && t.event === event); }
  onTransition(listener) { this._listeners.push(listener); }
}

class CartItem {
  constructor(name, price) { this._name = name; this._price = price; }
  getName() { return this._name; }
  getPrice() { return this._price; }
  getShippingCost() { throw new Error('Not implemented'); }
  getSummary() { return `${this._name} — ${this._price} PLN`; }
}

class PhysicalItem extends CartItem {
  constructor(name, price, weightKg) { super(name, price); this._weightKg = weightKg; }
  getWeightKg() { return this._weightKg; }
  getShippingCost() { return this._weightKg * 5; }
  getSummary() { return `${this.getName()} — ${this.getPrice()} PLN + ${this.getShippingCost()} PLN shipping (${this._weightKg} kg)`; }
}

class DigitalItem extends CartItem {
  constructor(name, price, downloadUrl) { super(name, price); this._downloadUrl = downloadUrl; }
  getDownloadUrl() { return this._downloadUrl; }
  getShippingCost() { return 0; }
  getSummary() { return `${this.getName()} — ${this.getPrice()} PLN (digital, no shipping)`; }
}

class ItemCart {
  constructor() { this._items = []; }
  add(item) {
    if (!(item instanceof CartItem)) throw new TypeError('Expected CartItem instance');
    this._items.push(item);
  }
  getTotal() { return this._items.reduce((sum, i) => sum + i.getPrice() + i.getShippingCost(), 0); }
  getItems() { return [...this._items]; }
  count() { return this._items.length; }
}

class DatabaseRecord {
  constructor(id) { this._id = id; this._dirty = false; this._createdAt = new Date(); }
  getId() { return this._id; }
  getCreatedAt() { return this._createdAt; }
  isDirty() { return this._dirty; }
  markDirty() { this._dirty = true; }
  markClean() { this._dirty = false; }
  toObject() { throw new Error('Not implemented'); }
}

class UserRecord extends DatabaseRecord {
  constructor(id, email, username) { super(id); this._email = email; this._username = username; }
  getEmail() { return this._email; }
  getUsername() { return this._username; }
  setEmail(email) { this._email = email; this.markDirty(); }
  toObject() { return { id: this.getId(), email: this._email, username: this._username, createdAt: this.getCreatedAt() }; }
}

class ProductRecord extends DatabaseRecord {
  constructor(id, name, price) { super(id); this._name = name; this._price = price; }
  getName() { return this._name; }
  getPrice() { return this._price; }
  setPrice(price) { this._price = price; this.markDirty(); }
  toObject() { return { id: this.getId(), name: this._name, price: this._price, createdAt: this.getCreatedAt() }; }
}

class Repository {
  constructor() { this._records = []; }
  insert(record) {
    if (!(record instanceof DatabaseRecord)) throw new TypeError('Expected DatabaseRecord instance');
    this._records.push(record);
  }
  save(record) { record.markClean(); }
  getDirty() { return this._records.filter(r => r.isDirty()); }
  findById(id) { return this._records.find(r => r.getId() === id); }
}

// Exporting all functions
module.exports = {
  reverseString,
  getMaxNumber,
  getMinNumber,
  countOccurrences,
  flattenArray,
  uniqueArray,
  isEmpty,
  isValidEmail,
  getDaysBetweenDates,
  groupBy,
  pick,
  omit,
  camelToSnakeCase,
  snakeToCamelCase,
  getCurrentTimestamp,
  padNumber,
  truncateString,
  clamp,
  randomInRange,
  attempt,
  returnPowerOf,
  getOccurencesOfChar,
  isOdd,
  concatenateArrays,
  capitalizeWords,
  calculateAverage,
  containsSubstring,
  sortNumbersAscending,
  factorial,
  removeWhitespace,
  arrayContainsElement,
  isPositive,
  sumArray,
  findMax,
  replaceSubstring,
  sortStringsAlphabetically,
  getRandomNumber,
  isNegative,
  removeDuplicates,
  toLowerCase,
  getEvenNumbers,
  moveVector,
  arrayFunction,
  switchFunction,
  fibonacci,
  factorialize,
  convertFtoC,
  isPalindrome,
  isPrime,
  gcd,
  lcm,
  sumDigits,
  countWords,
  titleCase,
  repeatString,
  chunkArray,
  zipArrays,
  intersection,
  difference,
  rotateArray,
  invertObject,
  toBinary,
  fromBinary,
  numberToRoman,
  toCurrency,
  deepClone,
  flattenDeep,
  BankAccount,
  Stack,
  EventEmitter,
  LinkedList,
  ObservableValue,
  LRUCache,
  ShoppingCart,
  UserValidator,
  TaskManager,
  RateLimiter,
  Pipeline,
  StateMachine,
  CartItem,
  PhysicalItem,
  DigitalItem,
  ItemCart,
  DatabaseRecord,
  UserRecord,
  ProductRecord,
  Repository,
};

// ── Exercise 86: e-commerce ──────────────────────────────────────────────────
function OutOfStock(message) { this.message = message; this.name = 'OutOfStock'; }
function InvalidCoupon(message) { this.message = message; this.name = 'InvalidCoupon'; }
function UnregisteredCustomer(message) { this.message = message; this.name = 'UnregisteredCustomer'; }

class Product {
  constructor(id, name, price, stock) { this._id = id; this._name = name; this._price = price; this._stock = stock; }
  getId() { return this._id; }
  getName() { return this._name; }
  getPrice() { return this._price; }
  getStock() { return this._stock; }
  decreaseStock(qty) {
    if (qty > this._stock) throw new OutOfStock(`Not enough stock for ${this._name}`);
    this._stock -= qty;
  }
}

class Cart {
  constructor() { this._items = []; }
  addItem(product, qty) {
    if (!(product instanceof Product)) throw new TypeError('Expected Product instance');
    if (qty > product.getStock()) throw new OutOfStock(`Not enough stock`);
    const existing = this._items.find(i => i.product === product);
    if (existing) existing.qty += qty;
    else this._items.push({ product, qty });
  }
  getItems() { return [...this._items]; }
  getSubtotal() { return this._items.reduce((s, i) => s + i.product.getPrice() * i.qty, 0); }
  getTotal() { return this.getSubtotal(); }
}

class DiscountedCart extends Cart {
  constructor(validCoupons) { super(); this._coupons = validCoupons; this._discount = 0; }
  applyCoupon(code) {
    if (!this._coupons.has(code)) throw new InvalidCoupon(`Invalid coupon: ${code}`);
    this._discount = this._coupons.get(code);
  }
  getTotal() { return this.getSubtotal() * (1 - this._discount / 100); }
}

class Customer {
  constructor(id, name) { this._id = id; this._name = name; this.orders = []; }
  getId() { return this._id; }
  getName() { return this._name; }
}

class Order {
  constructor() { this._customers = new Set(); }
  registerCustomer(customer) {
    if (!(customer instanceof Customer)) throw new TypeError('Expected Customer instance');
    this._customers.add(customer);
  }
  placeOrder(customer, cart) {
    if (!this._customers.has(customer)) throw new UnregisteredCustomer(`Unknown customer`);
    cart.getItems().forEach(({ product, qty }) => product.decreaseStock(qty));
    const result = { customer, items: cart.getItems(), total: cart.getTotal() };
    customer.orders.push(result);
    return result;
  }
}

module.exports.OutOfStock = OutOfStock;
module.exports.InvalidCoupon = InvalidCoupon;
module.exports.UnregisteredCustomer = UnregisteredCustomer;
module.exports.Product = Product;
module.exports.Cart = Cart;
module.exports.DiscountedCart = DiscountedCart;
module.exports.Customer = Customer;
module.exports.Order = Order;

// ── Exercise 87: music player ────────────────────────────────────────────────
function AlreadyInPlaylist(message) { this.message = message; this.name = 'AlreadyInPlaylist'; }
function SongNotFound(message) { this.message = message; this.name = 'SongNotFound'; }
function UnknownUser(message) { this.message = message; this.name = 'UnknownUser'; }

class Song {
  constructor(id, title, artist, bpm, durationSec) { this._id = id; this._title = title; this._artist = artist; this._bpm = bpm; this._dur = durationSec; }
  getId() { return this._id; }
  getTitle() { return this._title; }
  getArtist() { return this._artist; }
  getBpm() { return this._bpm; }
  getDuration() { return this._dur; }
}

class Playlist {
  constructor(name) { this._name = name; this._songs = []; }
  addSong(song) {
    if (!(song instanceof Song)) throw new TypeError('Expected Song instance');
    if (this._songs.find(s => s.getId() === song.getId())) throw new AlreadyInPlaylist(`Already in playlist`);
    this._songs.push(song);
  }
  removeSong(id) {
    const idx = this._songs.findIndex(s => s.getId() === id);
    if (idx === -1) throw new SongNotFound(`Song not found: ${id}`);
    this._songs.splice(idx, 1);
  }
  getSongs() { return [...this._songs]; }
  getTotalDuration() { return this._songs.reduce((s, song) => s + song.getDuration(), 0); }
}

class SmartPlaylist extends Playlist {
  constructor(name, sortBy) { super(name); this._sortBy = sortBy; }
  addSong(song) {
    super.addSong(song);
    this._songs.sort((a, b) => this._sortBy === 'bpm' ? a.getBpm() - b.getBpm() : a.getDuration() - b.getDuration());
  }
}

class MusicUser {
  constructor(id, name) { this._id = id; this._name = name; this.playlists = []; }
  getId() { return this._id; }
  getName() { return this._name; }
}

class Player {
  constructor() { this._users = new Set(); }
  registerUser(user) {
    if (!(user instanceof MusicUser)) throw new TypeError('Expected User instance');
    this._users.add(user);
  }
  addPlaylistToUser(user, playlist) {
    if (!this._users.has(user)) throw new UnknownUser(`Unknown user`);
    user.playlists.push(playlist);
  }
  getPlaylistsByUser(user) {
    if (!this._users.has(user)) throw new UnknownUser(`Unknown user`);
    return user.playlists;
  }
}

module.exports.AlreadyInPlaylist = AlreadyInPlaylist;
module.exports.SongNotFound = SongNotFound;
module.exports.UnknownUser = UnknownUser;
module.exports.Song = Song;
module.exports.Playlist = Playlist;
module.exports.SmartPlaylist = SmartPlaylist;
module.exports.User = MusicUser;
module.exports.Player = Player;

// ── Exercise 88: kanban ──────────────────────────────────────────────────────
function TaskAlreadyAssigned(message) { this.message = message; this.name = 'TaskAlreadyAssigned'; }
function NoSuchTask(message) { this.message = message; this.name = 'NoSuchTask'; }
function UnknownMember(message) { this.message = message; this.name = 'UnknownMember'; }

class KanbanTask {
  constructor(id, title, priority, status = 'todo') { this._id = id; this._title = title; this._priority = priority; this._status = status; }
  getId() { return this._id; }
  getTitle() { return this._title; }
  getPriority() { return this._priority; }
  getStatus() { return this._status; }
  setStatus(status) { this._status = status; }
}

class Board {
  constructor(name) { this._name = name; this._tasks = []; }
  addTask(task) {
    if (!(task instanceof KanbanTask)) throw new TypeError('Expected Task instance');
    if (this._tasks.find(t => t.getId() === task.getId())) throw new TaskAlreadyAssigned(`Task already on board`);
    this._tasks.push(task);
  }
  removeTask(id) {
    const idx = this._tasks.findIndex(t => t.getId() === id);
    if (idx === -1) throw new NoSuchTask(`Task not found: ${id}`);
    this._tasks.splice(idx, 1);
  }
  getTasksByStatus(status) { return this._tasks.filter(t => t.getStatus() === status); }
  getTasks() { return [...this._tasks]; }
}

class PriorityBoard extends Board {
  addTask(task) {
    super.addTask(task);
    this._tasks.sort((a, b) => b.getPriority() - a.getPriority());
  }
}

class TeamMember {
  constructor(id, name) { this._id = id; this._name = name; this.assignedTasks = []; }
  getId() { return this._id; }
  getName() { return this._name; }
}

class Project {
  constructor(name) { this._name = name; this._members = new Set(); this._boards = []; }
  addMember(member) {
    if (!(member instanceof TeamMember)) throw new TypeError('Expected TeamMember instance');
    this._members.add(member);
  }
  addBoard(board) {
    if (!(board instanceof Board)) throw new TypeError('Expected Board instance');
    this._boards.push(board);
  }
  assignTask(member, task) {
    if (!this._members.has(member)) throw new UnknownMember(`Unknown member`);
    const found = this._boards.some(b => b.getTasks().find(t => t.getId() === task.getId()));
    if (!found) throw new NoSuchTask(`Task not on any board`);
    member.assignedTasks.push(task);
  }
}

module.exports.TaskAlreadyAssigned = TaskAlreadyAssigned;
module.exports.NoSuchTask = NoSuchTask;
module.exports.UnknownMember = UnknownMember;
module.exports.Task = KanbanTask;
module.exports.Board = Board;
module.exports.PriorityBoard = PriorityBoard;
module.exports.TeamMember = TeamMember;
module.exports.Project = Project;

// ── Exercise 89: university ──────────────────────────────────────────────────
function AlreadyEnrolled(message) { this.message = message; this.name = 'AlreadyEnrolled'; }
function CourseFull(message) { this.message = message; this.name = 'CourseFull'; }
function UnknownStudent(message) { this.message = message; this.name = 'UnknownStudent'; }

class Student {
  constructor(id, name) { this._id = id; this._name = name; this.enrolledCourses = []; }
  getId() { return this._id; }
  getName() { return this._name; }
}

class Course {
  constructor(id, title) { this._id = id; this._title = title; this._students = []; }
  enroll(student) {
    if (!(student instanceof Student)) throw new TypeError('Expected Student instance');
    if (this._students.find(s => s.getId() === student.getId())) throw new AlreadyEnrolled(`Already enrolled`);
    this._students.push(student);
    student.enrolledCourses.push(this);
  }
  unenroll(studentId) {
    const idx = this._students.findIndex(s => s.getId() === studentId);
    if (idx === -1) throw new UnknownStudent(`Student not found`);
    this._students.splice(idx, 1);
  }
  getStudents() { return [...this._students]; }
  getEnrollmentCount() { return this._students.length; }
}

class CapacityCourse extends Course {
  constructor(id, title, maxStudents) { super(id, title); this._max = maxStudents; }
  enroll(student) {
    if (this.getEnrollmentCount() >= this._max) throw new CourseFull(`Course is full`);
    super.enroll(student);
  }
}

class Lecturer {
  constructor(id, name) { this._id = id; this._name = name; this.courses = []; }
  getId() { return this._id; }
  getName() { return this._name; }
}

class University {
  constructor() { this._students = new Set(); this._courses = []; }
  registerStudent(student) {
    if (!(student instanceof Student)) throw new TypeError('Expected Student instance');
    this._students.add(student);
  }
  addCourse(course, lecturer) { this._courses.push(course); lecturer.courses.push(course); }
  enrollStudent(student, course) {
    if (!this._students.has(student)) throw new UnknownStudent(`Student not registered`);
    course.enroll(student);
  }
  getCoursesByLecturer(lecturer) { return lecturer.courses; }
}

module.exports.AlreadyEnrolled = AlreadyEnrolled;
module.exports.CourseFull = CourseFull;
module.exports.UnknownStudent = UnknownStudent;
module.exports.Student = Student;
module.exports.Course = Course;
module.exports.CapacityCourse = CapacityCourse;
module.exports.Lecturer = Lecturer;
module.exports.University = University;

// ── Exercise 90: support desk ────────────────────────────────────────────────
function TicketAlreadyClosed(message) { this.message = message; this.name = 'TicketAlreadyClosed'; }
function NoSuchTicket(message) { this.message = message; this.name = 'NoSuchTicket'; }
function UnassignedAgent(message) { this.message = message; this.name = 'UnassignedAgent'; }

class Ticket {
  constructor(id, subject, urgency) { this._id = id; this._subject = subject; this._urgency = urgency; this._status = 'open'; }
  getId() { return this._id; }
  getSubject() { return this._subject; }
  getUrgency() { return this._urgency; }
  getStatus() { return this._status; }
  close() {
    if (this._status === 'closed') throw new TicketAlreadyClosed(`Ticket already closed`);
    this._status = 'closed';
  }
}

class TicketQueue {
  constructor() { this._tickets = []; }
  enqueue(ticket) {
    if (!(ticket instanceof Ticket)) throw new TypeError('Expected Ticket instance');
    if (ticket.getStatus() === 'closed') throw new TicketAlreadyClosed(`Cannot enqueue closed ticket`);
    this._tickets.push(ticket);
  }
  dequeue() { return this._tickets.shift(); }
  getTickets() { return [...this._tickets]; }
  size() { return this._tickets.length; }
}

class PriorityTicketQueue extends TicketQueue {
  enqueue(ticket) {
    super.enqueue(ticket);
    this._tickets.sort((a, b) => b.getUrgency() - a.getUrgency());
  }
}

class Agent {
  constructor(id, name) { this._id = id; this._name = name; this.assignedTickets = []; }
  getId() { return this._id; }
  getName() { return this._name; }
}

class SupportDesk {
  constructor() { this._agents = new Set(); this._queue = new TicketQueue(); }
  registerAgent(agent) {
    if (!(agent instanceof Agent)) throw new TypeError('Expected Agent instance');
    this._agents.add(agent);
  }
  submitTicket(ticket) { this._queue.enqueue(ticket); }
  assignNext(agent) {
    if (!this._agents.has(agent)) throw new UnassignedAgent(`Agent not registered`);
    const ticket = this._queue.dequeue();
    if (!ticket) throw new NoSuchTicket(`No tickets in queue`);
    agent.assignedTickets.push(ticket);
    return ticket;
  }
}

module.exports.TicketAlreadyClosed = TicketAlreadyClosed;
module.exports.NoSuchTicket = NoSuchTicket;
module.exports.UnassignedAgent = UnassignedAgent;
module.exports.Ticket = Ticket;
module.exports.Queue = TicketQueue;
module.exports.PriorityQueue = PriorityTicketQueue;
module.exports.Agent = Agent;
module.exports.SupportDesk = SupportDesk;

// ── Exercise 91: cinema ──────────────────────────────────────────────────────
function AlreadyReserved(message) { this.message = message; this.name = 'AlreadyReserved'; }
function NoSuchMovie(message) { this.message = message; this.name = 'NoSuchMovie'; }
function UnregisteredMember(message) { this.message = message; this.name = 'UnregisteredMember'; }

class Movie {
  constructor(id, title, rating, seats) { this._id = id; this._title = title; this._rating = rating; this._seats = seats; }
  getId() { return this._id; }
  getTitle() { return this._title; }
  getRating() { return this._rating; }
  getAvailableSeats() { return this._seats; }
  reserveSeat() {
    if (this._seats === 0) throw new AlreadyReserved(`No seats available`);
    this._seats--;
  }
}

class Watchlist {
  constructor(name) { this._name = name; this._movies = []; }
  addMovie(movie) {
    if (!(movie instanceof Movie)) throw new TypeError('Expected Movie instance');
    this._movies.push(movie);
  }
  removeMovie(id) {
    const idx = this._movies.findIndex(m => m.getId() === id);
    if (idx === -1) throw new NoSuchMovie(`Movie not found: ${id}`);
    this._movies.splice(idx, 1);
  }
  getMovies() { return [...this._movies]; }
}

class SortedWatchlist extends Watchlist {
  addMovie(movie) {
    super.addMovie(movie);
    this._movies.sort((a, b) => b.getRating() - a.getRating());
  }
}

class CinemaMember {
  constructor(id, name) { this._id = id; this._name = name; this.reservations = []; }
  getId() { return this._id; }
  getName() { return this._name; }
}

class Cinema {
  constructor() { this._members = new Set(); this._movies = []; }
  registerMember(member) {
    if (!(member instanceof CinemaMember)) throw new TypeError('Expected Member instance');
    this._members.add(member);
  }
  addMovie(movie) {
    if (!(movie instanceof Movie)) throw new TypeError('Expected Movie instance');
    this._movies.push(movie);
  }
  reserve(member, movie) {
    if (!this._members.has(member)) throw new UnregisteredMember(`Member not registered`);
    if (!this._movies.find(m => m.getId() === movie.getId())) throw new NoSuchMovie(`Movie not in repertoire`);
    movie.reserveSeat();
    member.reservations.push(movie);
  }
  getMovieByTitle(title) { return this._movies.find(m => m.getTitle() === title); }
}

module.exports.AlreadyReserved = AlreadyReserved;
module.exports.NoSuchMovie = NoSuchMovie;
module.exports.UnregisteredMember = UnregisteredMember;
module.exports.Movie = Movie;
module.exports.Watchlist = Watchlist;
module.exports.SortedWatchlist = SortedWatchlist;
module.exports.Member = CinemaMember;
module.exports.Cinema = Cinema;

// ── Exercise 92: parking ─────────────────────────────────────────────────────
function SpotTaken(message) { this.message = message; this.name = 'SpotTaken'; }
function WrongVehicleType(message) { this.message = message; this.name = 'WrongVehicleType'; }
function UnknownDriver(message) { this.message = message; this.name = 'UnknownDriver'; }

class Vehicle {
  constructor(plate, type) { this._plate = plate; this._type = type; }
  getPlate() { return this._plate; }
  getType() { return this._type; }
}

class ParkingSpot {
  constructor(id) { this._id = id; this._vehicle = null; }
  getId() { return this._id; }
  isOccupied() { return this._vehicle !== null; }
  getVehicle() { return this._vehicle; }
  park(vehicle) {
    if (!(vehicle instanceof Vehicle)) throw new TypeError('Expected Vehicle instance');
    if (this._vehicle) throw new SpotTaken(`Spot ${this._id} is taken`);
    this._vehicle = vehicle;
  }
  leave() {
    if (!this._vehicle) throw new SpotTaken(`Spot ${this._id} is already empty`);
    this._vehicle = null;
  }
}

class ReservedSpot extends ParkingSpot {
  constructor(id, allowedType) { super(id); this._allowedType = allowedType; }
  park(vehicle) {
    if (vehicle.getType() !== this._allowedType) throw new WrongVehicleType(`Only ${this._allowedType} allowed`);
    super.park(vehicle);
  }
}

class Driver {
  constructor(id, name) { this._id = id; this._name = name; this.parkedVehicles = []; }
  getId() { return this._id; }
  getName() { return this._name; }
}

class ParkingLot {
  constructor() { this._drivers = new Set(); this._spots = []; }
  registerDriver(driver) {
    if (!(driver instanceof Driver)) throw new TypeError('Expected Driver instance');
    this._drivers.add(driver);
  }
  addSpot(spot) {
    if (!(spot instanceof ParkingSpot)) throw new TypeError('Expected ParkingSpot instance');
    this._spots.push(spot);
  }
  parkVehicle(driver, vehicle, spotId) {
    if (!this._drivers.has(driver)) throw new UnknownDriver(`Driver not registered`);
    const spot = this._spots.find(s => s.getId() === spotId);
    spot.park(vehicle);
    driver.parkedVehicles.push(vehicle);
  }
  getAvailableSpots() { return this._spots.filter(s => !s.isOccupied()); }
}

module.exports.SpotTaken = SpotTaken;
module.exports.WrongVehicleType = WrongVehicleType;
module.exports.UnknownDriver = UnknownDriver;
module.exports.Vehicle = Vehicle;
module.exports.ParkingSpot = ParkingSpot;
module.exports.ReservedSpot = ReservedSpot;
module.exports.Driver = Driver;
module.exports.ParkingLot = ParkingLot;