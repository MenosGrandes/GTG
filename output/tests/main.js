const functions = require("./functions.js");
// Set global timeout for all tests (in milliseconds)
// This prevents infinite loops and ensures tests complete quickly
jest.setTimeout(10000); // 10 seconds per test
// Run func N times — used by every test to get statistical coverage with random data
function __mg_callN(func, N) {
  for (let i = 0; i < N; i++) func();
}
const callN = __mg_callN;
const __mg__callNGlobalCount = 20;

// Random lowercase ASCII string of length N
function __mg_randomString(N) {
  let s = "";
  for (let i = 0; i < N; i++) s += String.fromCharCode(((Math.random() * 26) | 0) + 97);
  return s;
}

// Random integer array of given length, values in [0, max]
function __mg__generateRandomArray(length, max) {
  return Array.from({ length }, () => (Math.random() * (max + 1)) | 0);
}

// Random integer in [min, max)
function __mg__getRandomInt(min, max) {
  return ((Math.random() * (Math.ceil(max) - Math.ceil(min))) | 0) + Math.ceil(min);
}
// Random integer in [min, max)
function __mg_randomInt(min, max) {
  return ((Math.random() * (Math.ceil(max) - Math.ceil(min))) | 0) + Math.ceil(min);
}

// Random float in [min, max) with given decimal places
function __mg_randomFloat(min, max, decimals) {
  const val = Math.random() * (max - min) + min;
  return decimals !== undefined
    ? Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals)
    : val;
}

// Custom matcher: toThrowClass(ErrorClass)
// or if the thrown error is not an instance of ErrorClass.
expect.extend({
  toThrowClass(fn, ErrorClass) {
    if (typeof ErrorClass !== "function") {
      return {
        pass: false,
        message: () =>
          `toThrowClass() received ${String(ErrorClass)} instead of a constructor.\n` +
          `Make sure the error class is defined and exported`,
      };
    }
    try {
      fn();
      return {
        pass: false,
        message: () => `Expected function to throw ${ErrorClass.name}, but it did not throw.`,
      };
    } catch (err) {
      if (err instanceof ErrorClass) {
        return { pass: true, message: () => `Expected function not to throw ${ErrorClass.name}.` };
      }
      return {
        pass: false,
        message: () =>
          `Expected function to throw ${ErrorClass.name}, but it threw: ${err && err.constructor ? err.constructor.name : String(err)}.`,
      };
    }
  },
});

expect.extend({
  toBePrivateOrUndefined(received) {
    if (received === undefined) {
      return {
        pass: true,
        message: () =>
          `Expected property to be publicly accessible, but it was undefined (private or not exposed).`,
      };
    }
    return {
      pass: false,
      message: () =>
        `Expected property to be private (undefined from outside), but got: ${JSON.stringify(received)}.`,
    };
  },
});

test('NotificationDispatcher - send throws RecipientNotFound and ChannelNotConfigured', () => {
  callN(() => {
    const dispatcher = new functions.NotificationDispatcher();
    expect(() => dispatcher.send(__mg_randomString(4), __mg_randomString(4))).toThrowClass(functions.RecipientNotFound);
    dispatcher.addRecipient('r1', __mg_randomString(8) + '@test.com');
    const tmpl = new functions.NotificationTemplate(__mg_randomString(4), 'push', __mg_randomString(20));
    dispatcher.addTemplate(tmpl);
    expect(() => dispatcher.send('r1', tmpl.id)).toThrowClass(functions.ChannelNotConfigured);
  }, __mg__callNGlobalCount);
});

test('EmailChannel and SmsChannel extend NotificationChannel; SmsChannel has 160 char limit', () => {
  callN(() => {
    const email = new functions.EmailChannel(__mg_randomString(6) + '.com');
    const sms = new functions.SmsChannel();
    expect(email instanceof functions.NotificationChannel).toBe(true);
    expect(sms instanceof functions.NotificationChannel).toBe(true);
    expect(sms.maxLength).toBe(160);
    expect(() => sms.send(__mg_randomString(5), __mg_randomString(161))).toThrowClass(functions.MessageTooLong);
  }, __mg__callNGlobalCount);
});

test('NotificationDispatcher - send delivers message through correct channel', () => {
  callN(() => {
    const dispatcher = new functions.NotificationDispatcher();
    const email = new functions.EmailChannel(__mg_randomString(6) + '.com');
    dispatcher.addChannel(email);
    const contact = __mg_randomString(5) + '@test.com';
    dispatcher.addRecipient('r1', contact);
    const body = __mg_randomString(__mg_randomInt(10, 50));
    const tmpl = new functions.NotificationTemplate(__mg_randomString(4), 'email', body);
    dispatcher.addTemplate(tmpl);
    dispatcher.send('r1', tmpl.id);
    expect(email.getSentCount()).toBe(1);
  }, __mg__callNGlobalCount);
});

test('NotificationChannel - send throws MessageTooLong when exceeding maxLength', () => {
  callN(() => {
    const maxLen = __mg_randomInt(10, 30);
    const channel = new functions.NotificationChannel('test', maxLen);
    expect(() => channel.send(__mg_randomString(5), __mg_randomString(maxLen + 1))).toThrowClass(functions.MessageTooLong);
    channel.send(__mg_randomString(5), __mg_randomString(maxLen));
    expect(channel.getSentCount()).toBe(1);
  }, __mg__callNGlobalCount);
});

test('NotificationDispatcher - getTotalSent sums across all channels', () => {
  callN(() => {
    const dispatcher = new functions.NotificationDispatcher();
    const email = new functions.EmailChannel('test.com');
    const sms = new functions.SmsChannel();
    dispatcher.addChannel(email);
    dispatcher.addChannel(sms);
    dispatcher.addRecipient('r1', 'a@test.com');
    const emailTmpl = new functions.NotificationTemplate('t1', 'email', __mg_randomString(20));
    const smsTmpl = new functions.NotificationTemplate('t2', 'sms', __mg_randomString(20));
    dispatcher.addTemplate(emailTmpl);
    dispatcher.addTemplate(smsTmpl);
    const n = __mg_randomInt(1, 4);
    for (let i = 0; i < n; i++) dispatcher.send('r1', 't1');
    dispatcher.send('r1', 't2');
    expect(dispatcher.getTotalSent()).toBe(n + 1);
  }, __mg__callNGlobalCount);
});

test('DatabaseRecord hierarchy - instanceof check and insert rejects non-DatabaseRecord', () => {
  callN(() => {
    const id1 = __mg_randomInt(1, 1001);
    const id2 = id1 + 1;
    const u = new functions.UserRecord(id1, __mg_randomString(5) + '@x.com', __mg_randomString(6));
    const p = new functions.ProductRecord(id2, __mg_randomString(6), __mg_randomFloat(1, 100));
    expect(u instanceof functions.DatabaseRecord).toBe(true);
    expect(p instanceof functions.DatabaseRecord).toBe(true);
    const repo = new functions.Repository();
    repo.insert(u);
    repo.insert(p);
    expect(() => repo.insert({ id: id2 + 1 })).toThrowClass(TypeError);
    expect(() => new functions.DatabaseRecord(id1 + 99).toObject()).toThrowClass(Error);
  }, __mg__callNGlobalCount);
});

test('DatabaseRecord - dirty flag lifecycle', () => {
  callN(() => {
    const email = __mg_randomString(5) + '@test.com';
    const newEmail = __mg_randomString(5) + '@new.com';
    const u = new functions.UserRecord(__mg_randomInt(1, 101), email, __mg_randomString(6));
    expect(u.isDirty()).toBe(false);
    u.setEmail(newEmail);
    expect(u.isDirty()).toBe(true);
    expect(u.getEmail()).toBe(newEmail);
    u.markClean();
    expect(u.isDirty()).toBe(false);
  }, __mg__callNGlobalCount);
});

test('UserRecord - toObject contains all fields', () => {
  callN(() => {
    const id = __mg_randomInt(1, 1001);
    const email = __mg_randomString(5) + '@test.com';
    const username = __mg_randomString(8);
    const u = new functions.UserRecord(id, email, username);
    const obj = u.toObject();
    expect(obj.id).toBe(id);
    expect(obj.email).toBe(email);
    expect(obj.username).toBe(username);
    expect(obj.createdAt).toBeInstanceOf(Date);
  }, __mg__callNGlobalCount);
});

test('ProductRecord - setPrice marks dirty', () => {
  callN(() => {
    const id = __mg_randomInt(1, 101);
    const name = __mg_randomString(6);
    const price = __mg_randomInt(1, 101);
    const newPrice = price + __mg_randomInt(1, 51);
    const p = new functions.ProductRecord(id, name, price);
    expect(p.isDirty()).toBe(false);
    p.setPrice(newPrice);
    expect(p.getPrice()).toBe(newPrice);
    expect(p.isDirty()).toBe(true);
    const obj = p.toObject();
    expect(obj.id).toBe(id);
    expect(obj.name).toBe(name);
    expect(obj.price).toBe(newPrice);
    expect(obj.createdAt).toBeInstanceOf(Date);
  }, __mg__callNGlobalCount);
});

test('Repository - getDirty and findById', () => {
  callN(() => {
    const repo = new functions.Repository();
    const id1 = __mg_randomInt(1, 501);
    const id2 = id1 + 1;
    const u = new functions.UserRecord(id1, __mg_randomString(4) + '@x.com', __mg_randomString(5));
    const p = new functions.ProductRecord(id2, __mg_randomString(5), 9.99);
    repo.insert(u);
    repo.insert(p);
    u.setEmail(__mg_randomString(4) + '@new.com');
    expect(repo.getDirty().length).toBe(1);
    expect(repo.getDirty()[0].getId()).toBe(id1);
    repo.save(u);
    expect(repo.getDirty().length).toBe(0);
    expect(repo.findById(id2)).toBe(p);
    expect(repo.findById(id2 + 9999)).toBeUndefined();
  }, __mg__callNGlobalCount);
});
test('ContentFeed - publish throws ProfileNotFound and ContentViolation', () => {
  callN(() => {
    const feed = new functions.ContentFeed(__mg_randomInt(10, 50));
    expect(() => feed.publish(__mg_randomString(8), __mg_randomString(4), __mg_randomString(5))).toThrowClass(functions.ProfileNotFound);
    const p = new functions.SocialProfile(__mg_randomString(4), __mg_randomString(6));
    feed.addProfile(p);
    const longContent = __mg_randomString(feed.maxContentLength + 1);
    expect(() => feed.publish(p.id, __mg_randomString(4), longContent)).toThrowClass(functions.ContentViolation);
  }, __mg__callNGlobalCount);
});

test('ContentFeed - publish creates post and adds to author posts', () => {
  callN(() => {
    const feed = new functions.ContentFeed(200);
    const p = new functions.SocialProfile(__mg_randomString(4), __mg_randomString(6));
    feed.addProfile(p);
    const content = __mg_randomString(__mg_randomInt(5, 20));
    const post = feed.publish(p.id, __mg_randomString(4), content);
    expect(post.content).toBe(content);
    expect(post.authorId).toBe(p.id);
    expect(p.posts).toContain(post);
  }, __mg__callNGlobalCount);
});

test('SocialComment - extends SocialPost and comment throws ProfileNotFound and ContentViolation', () => {
  callN(() => {
    const comment = new functions.SocialComment(__mg_randomString(4), __mg_randomString(4), __mg_randomString(10), __mg_randomString(4));
    expect(comment instanceof functions.SocialPost).toBe(true);
    expect(comment.parentPostId).toBeDefined();
    expect(comment.likes).toBe(0);
    const feed = new functions.ContentFeed(__mg_randomInt(50, 200));
    const p = new functions.SocialProfile(__mg_randomString(4), __mg_randomString(6));
    feed.addProfile(p);
    const postId = __mg_randomString(4);
    feed.publish(p.id, postId, __mg_randomString(10));
    expect(() => feed.comment(__mg_randomString(4), __mg_randomString(4), __mg_randomString(5), postId)).toThrowClass(functions.ProfileNotFound);
    const commentId = __mg_randomString(4) + 'c';
    feed.comment(p.id, commentId, __mg_randomString(10), postId);
    const maxLen = __mg_randomInt(10, 30);
    const feed2 = new functions.ContentFeed(maxLen);
    const p2 = new functions.SocialProfile(__mg_randomString(4), __mg_randomString(6));
    feed2.addProfile(p2);
    const postId2 = __mg_randomString(4);
    feed2.publish(p2.id, postId2, __mg_randomString(maxLen - 1));
    const longContent = __mg_randomString(maxLen + 5);
    expect(() => feed2.comment(p2.id, __mg_randomString(4), longContent, postId2)).toThrowClass(functions.ContentViolation);
  }, __mg__callNGlobalCount);
});

test('ContentFeed - followUser throws UserBlocked when blocked', () => {
  callN(() => {
    const feed = new functions.ContentFeed(200);
    const p1 = new functions.SocialProfile(__mg_randomString(4), __mg_randomString(6));
    const p2 = new functions.SocialProfile(__mg_randomString(4) + 'b', __mg_randomString(6));
    feed.addProfile(p1);
    feed.addProfile(p2);
    p2.block(p1.id);
    expect(() => feed.followUser(p1.id, p2.id)).toThrowClass(functions.UserBlocked);
  }, __mg__callNGlobalCount);
});

test('ContentFeed - getFeedFor returns posts from followed users sorted by engagement and throws ProfileNotFound', () => {
  callN(() => {
    const feed = new functions.ContentFeed(200);
    const p1 = new functions.SocialProfile(__mg_randomString(4), __mg_randomString(6));
    const p2 = new functions.SocialProfile(__mg_randomString(4) + 'b', __mg_randomString(6));
    feed.addProfile(p1);
    feed.addProfile(p2);
    feed.followUser(p1.id, p2.id);
    const post1 = feed.publish(p2.id, __mg_randomString(4), __mg_randomString(10));
    const post2 = feed.publish(p2.id, __mg_randomString(4) + 'b', __mg_randomString(10));
    const likes = __mg_randomInt(2, 10);
    for (let i = 0; i < likes; i++) post2.like();
    const result = feed.getFeedFor(p1.id);
    expect(result[0]).toBe(post2);
    expect(result[1]).toBe(post1);
    const feed2 = new functions.ContentFeed(__mg_randomInt(50, 200));
    expect(() => feed2.getFeedFor(__mg_randomString(6))).toThrowClass(functions.ProfileNotFound);
  }, __mg__callNGlobalCount);
});

test('Package - markDelivered sets delivered=true; assignCourier sets courierId', () => {
  callN(() => {
    const pkg = new functions.Package(__mg_randomString(4), __mg_randomString(8), __mg_randomString(8), __mg_randomInt(1, 20));
    expect(pkg.delivered).toBe(false);
    const courierId = __mg_randomString(4);
    pkg.assignCourier(courierId);
    expect(pkg.courierId).toBe(courierId);
    pkg.markDelivered();
    expect(pkg.delivered).toBe(true);
  }, __mg__callNGlobalCount);
});

test('Route - addStop maintains ascending order by distance; getEstimatedTime = totalDistance / speed', () => {
  callN(() => {
    const speed = __mg_randomInt(10, 60);
    const route = new functions.Route();
    const n = __mg_randomInt(2, 6);
    let total = 0;
    for (let i = 0; i < n; i++) {
      const dist = __mg_randomInt(1, 101);
      total += dist;
      route.addStop(__mg_randomString(5), dist);
    }
    const distances = route.stops.map(s => s.distance);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
    expect(route.getEstimatedTime(speed)).toBeCloseTo(total / speed);
  }, __mg__callNGlobalCount);
});

test('Courier - acceptPackage adds to assignedPackages; deliverPackage marks delivered and removes; getActiveCount correct', () => {
  callN(() => {
    const c = new functions.Courier(__mg_randomString(4), __mg_randomString(6));
    const n = __mg_randomInt(2, 6);
    const packages = [];
    for (let i = 0; i < n; i++) {
      const pkg = new functions.Package(__mg_randomString(4) + i, __mg_randomString(6), __mg_randomString(6), __mg_randomInt(1, 20));
      packages.push(pkg);
      c.acceptPackage(pkg);
      expect(pkg.courierId).toBe(c.id);
    }
    expect(c.assignedPackages.length).toBe(n);
    expect(c.getActiveCount()).toBe(n);
    c.deliverPackage(packages[0].id);
    expect(packages[0].delivered).toBe(true);
    expect(c.assignedPackages).not.toContain(packages[0]);
    expect(c.getActiveCount()).toBe(n - 1);
  }, __mg__callNGlobalCount);
});

test('DeliverySystem - assignPackage throws UnknownPackage, PackageAlreadyDelivered, CourierUnavailable; happy path assigns correctly', () => {
  callN(() => {
    const ds = new functions.DeliverySystem();
    const pkg = new functions.Package(__mg_randomString(4), __mg_randomString(6), __mg_randomString(6), __mg_randomInt(1, 20));
    const courier = new functions.Courier(__mg_randomString(4), __mg_randomString(6));
    ds.registerCourier(courier);
    expect(() => ds.assignPackage(pkg, courier)).toThrowClass(functions.UnknownPackage);
    ds.registerPackage(pkg);
    pkg.markDelivered();
    expect(() => ds.assignPackage(pkg, courier)).toThrowClass(functions.PackageAlreadyDelivered);
    const pkg2 = new functions.Package(__mg_randomString(4), __mg_randomString(6), __mg_randomString(6), __mg_randomInt(1, 20));
    ds.registerPackage(pkg2);
    courier.available = false;
    expect(() => ds.assignPackage(pkg2, courier)).toThrowClass(functions.CourierUnavailable);
    courier.available = true;
    ds.assignPackage(pkg2, courier);
    expect(courier.assignedPackages).toContain(pkg2);
  }, __mg__callNGlobalCount);
});

test('DeliverySystem - completeDelivery marks package delivered; getPendingPackages filters correctly', () => {
  callN(() => {
    const ds = new functions.DeliverySystem();
    expect(() => ds.completeDelivery(__mg_randomString(6))).toThrowClass(functions.UnknownPackage);
    const courier = new functions.Courier(__mg_randomString(4), __mg_randomString(6));
    ds.registerCourier(courier);
    const n = __mg_randomInt(2, 6);
    const packages = [];
    for (let i = 0; i < n; i++) {
      const pkg = new functions.Package(__mg_randomString(4) + i, __mg_randomString(6), __mg_randomString(6), __mg_randomInt(1, 20));
      ds.registerPackage(pkg);
      ds.assignPackage(pkg, courier);
      packages.push(pkg);
    }
    expect(ds.getPendingPackages().length).toBe(n);
    ds.completeDelivery(packages[0].id);
    expect(packages[0].delivered).toBe(true);
    expect(() => ds.completeDelivery(packages[0].id)).toThrowClass(functions.PackageAlreadyDelivered);
    expect(ds.getPendingPackages().length).toBe(n - 1);
  }, __mg__callNGlobalCount);
});
test('Movie - reserveSeat and AlreadyReserved', () => {
  callN(() => {
    const seats = __mg_randomInt(1, 6);
    const m = new functions.Movie(__mg_randomString(4), __mg_randomString(6), __mg_randomFloat(1, 10), seats);
    expect(m.getAvailableSeats()).toBe(seats);
    for (let i = 0; i < seats; i++) m.reserveSeat();
    expect(m.getAvailableSeats()).toBe(0);
    expect(() => m.reserveSeat()).toThrowClass(functions.AlreadyReserved);
  }, __mg__callNGlobalCount);
});

test('Watchlist - addMovie type guard and removeMovie', () => {
  callN(() => {
    const wl = new functions.Watchlist(__mg_randomString(6));
    expect(() => wl.addMovie({ id: __mg_randomString(3) })).toThrowClass(TypeError);
    const m = new functions.Movie(__mg_randomString(4), __mg_randomString(6), 8, 10);
    wl.addMovie(m);
    expect(wl.getMovies().length).toBe(1);
    wl.removeMovie(m.getId());
    expect(wl.getMovies().length).toBe(0);
    expect(() => wl.removeMovie(m.getId())).toThrowClass(functions.NoSuchMovie);
  }, __mg__callNGlobalCount);
});

test('SortedWatchlist - sorted by rating descending', () => {
  callN(() => {
    const sw = new functions.SortedWatchlist(__mg_randomString(5));
    const n = __mg_randomInt(3, 8);
    for (let i = 0; i < n; i++) {
      const rating = __mg_randomFloat(1, 10);
      sw.addMovie(new functions.Movie(__mg_randomString(4) + i, __mg_randomString(6), rating, 5));
    }
    const ratings = sw.getMovies().map(m => m.getRating());
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  }, __mg__callNGlobalCount);
});

test('Cinema - reserve throws UnregisteredCinemaMember, NoSuchMovie, and AlreadyReserved', () => {
  callN(() => {
    const cinema = new functions.Cinema();
    const mem = new functions.Member(__mg_randomString(4), __mg_randomString(6));
    const title = __mg_randomString(8);
    const seats = __mg_randomInt(2, 7);
    const m = new functions.Movie(__mg_randomString(4), title, 8, seats);
    cinema.addMovie(m);
    expect(() => cinema.reserve(mem, m)).toThrowClass(functions.UnregisteredCinemaMember);
    cinema.registerMember(mem);
    const unknown = new functions.Movie(__mg_randomString(4), __mg_randomString(6), 5, 5);
    expect(() => cinema.reserve(mem, unknown)).toThrowClass(functions.NoSuchMovie);
    cinema.reserve(mem, m);
    expect(mem.reservations).toContain(m);
    expect(m.getAvailableSeats()).toBe(seats - 1);
    expect(cinema.getMovieByTitle(title)).toBe(m);
    expect(cinema.getMovieByTitle(__mg_randomString(10))).toBeUndefined();
    for (let i = 1; i < seats; i++) cinema.reserve(mem, m);
    expect(() => cinema.reserve(mem, m)).toThrowClass(functions.AlreadyReserved);
  }, __mg__callNGlobalCount);
});

test('Cinema - getMovieByTitle returns correct movie or undefined', () => {
  callN(() => {
    const cinema = new functions.Cinema();
    const n = __mg_randomInt(2, 6);
    const titles = Array.from({ length: n }, (_, i) => __mg_randomString(6) + i);
    titles.forEach((t, i) => cinema.addMovie(new functions.Movie(__mg_randomString(4) + i, t, __mg_randomFloat(1, 10), 5)));
    const target = titles[__mg_randomInt(0, titles.length)];
    expect(cinema.getMovieByTitle(target).getTitle()).toBe(target);
    expect(cinema.getMovieByTitle(__mg_randomString(20))).toBeUndefined();
  }, __mg__callNGlobalCount);
});

