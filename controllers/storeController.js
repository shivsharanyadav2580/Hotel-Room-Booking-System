const User = require("../models/User");
const Home = require("../models/Home");
const Booking = require("../models/Booking");
const Review = require("../models/Review");

const filterHomes = (homes, location, minPrice, maxPrice, sortBy) => {
  let filtered = [...homes];
  if (location && String(location).trim()) {
    filtered = filtered.filter((h) =>
      (h.location || "").toLowerCase().includes(String(location).toLowerCase())
    );
  }
  if (minPrice && !isNaN(Number(minPrice))) {
    filtered = filtered.filter((h) => Number(h.price) >= Number(minPrice));
  }
  if (maxPrice && !isNaN(Number(maxPrice))) {
    filtered = filtered.filter((h) => Number(h.price) <= Number(maxPrice));
  }
  if (sortBy) {
    if (sortBy === "price-asc") filtered.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price-desc") filtered.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === "rating-desc") filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
  }
  return filtered;
};

exports.getIndex = async (req, res, next) => {
  try {
    const { location, minPrice, maxPrice, sortBy } = req.query;
    const registeredHomes = await Home.find().lean();
    const filtered = filterHomes(registeredHomes, location, minPrice, maxPrice, sortBy);
    const totalBookings = await Booking.countDocuments({ status: { $ne: "cancelled" } });

    res.render("store/index", {
      homes: filtered,
      pageTitle: "Tumahara airbnb",
      searchLocation: location || "",
      searchMinPrice: minPrice || "",
      searchMaxPrice: maxPrice || "",
      sortBy: sortBy || "",
      totalHomes: registeredHomes.length,
      totalBookings,
      isLoggedIn: req.session.isLoggedIn || false,
      user: req.session.user || null,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
};

exports.getHomes = async (req, res, next) => {
  try {
    const { location, minPrice, maxPrice, sortBy } = req.query;
    const registeredHomes = await Home.find().lean();
    const filtered = filterHomes(registeredHomes, location, minPrice, maxPrice, sortBy);

    res.render("store/homes", {
      homes: filtered,
      pageTitle: "Tumahara airbnb",
      searchLocation: location || "",
      searchMinPrice: minPrice || "",
      searchMaxPrice: maxPrice || "",
      sortBy: sortBy || "",
      isLoggedIn: req.session.isLoggedIn || false,
      user: req.session.user || null,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/homes");
  }
};

exports.getFavourites = async (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  try {
    const { error } = req.query;
    const user = await User.findById(req.session.user._id).populate("favouriteHomes");
    const favouriteHomes = user.favouriteHomes || [];

    res.render("store/favourites", {
      homes: favouriteHomes,
      pageTitle: "Favourites",
      errorMessage: error === "add" ? "Could not add to favourites. Home not found." : null,
      errorMessageRemove: error === "remove" ? "Could not remove from favourites." : null,
      isLoggedIn: true,
      user: req.session.user,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
};

exports.postAddFavourites = async (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  const homeId = req.body && req.body.id ? String(req.body.id).trim() : "";
  if (!homeId) {
    return res.redirect("/favourites?error=add");
  }

  try {
    const home = await Home.findById(homeId);
    if (!home) {
      return res.redirect("/favourites?error=add");
    }

    const user = await User.findById(req.session.user._id);
    if (!user.favouriteHomes.includes(homeId)) {
      user.favouriteHomes.push(homeId);
      await user.save();
    }
    res.redirect("/favourites");
  } catch (err) {
    console.log(err);
    res.redirect("/favourites?error=add");
  }
};

exports.postRemoveFavourite = async (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
  const homeId = req.params.homeId;
  if (!homeId) {
    return res.redirect("/favourites");
  }

  try {
    await User.findByIdAndUpdate(req.session.user._id, {
      $pull: { favouriteHomes: homeId },
    });
    res.redirect("/favourites");
  } catch (err) {
    console.log(err);
    res.redirect("/favourites?error=remove");
  }
};

exports.getHomeDetails = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const home = await Home.findById(homeId).lean();
    if (!home) {
      return res.redirect("/homes");
    }

    const reviews = await Review.find({ home: homeId })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.render("store/home-detail", {
      home,
      reviews: reviews.map((r) => ({ ...r, guestName: r.user ? r.user.name : "Anonymous" })),
      pageTitle: "Home Detail",
      isLoggedIn: req.session.isLoggedIn || false,
      user: req.session.user || null,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/homes");
  }
};

exports.getAbout = (req, res) => {
  res.render("store/about", {
    pageTitle: "About Us",
    isLoggedIn: req.session.isLoggedIn || false,
    user: req.session.user || null,
  });
};

exports.getContact = (req, res) => {
  res.render("store/contact", {
    pageTitle: "Contact Us",
    isLoggedIn: req.session.isLoggedIn || false,
    user: req.session.user || null,
  });
};
