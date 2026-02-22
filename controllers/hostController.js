const Home = require("../models/Home");

exports.getAddHome = (req, res) => {
  res.render("host/edit-home", {
    editing: false,
    pageTitle: "Host Your Home",
    isLoggedIn: true,
    user: req.session.user,
  });
};

exports.getEditHome = async (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === "true";
  if (!editing) {
    return res.redirect("/host/host-homes");
  }

  try {
    const home = await Home.findById(homeId);
    if (!home) {
      return res.redirect("/host/host-homes");
    }
    if (home.host && home.host.toString() !== req.session.user._id.toString()) {
      return res.redirect("/host/host-homes");
    }

    res.render("host/edit-home", {
      home: home.toObject(),
      editing: true,
      pageTitle: "Edit Your Home",
      isLoggedIn: true,
      user: req.session.user,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/host/host-homes");
  }
};

exports.postAddHome = async (req, res, next) => {
  try {
    const { houseName, price, location, rating, photoUrl } = req.body;
    const home = new Home({
      houseName,
      price: Number(price) || 0,
      location,
      rating: Number(rating) || 5,
      photoUrl: photoUrl || "",
      host: req.session.user._id,
    });
    await home.save();
    res.redirect("/host/host-homes");
  } catch (err) {
    console.log(err);
    res.redirect("/host/add-home");
  }
};

exports.postEditHome = async (req, res, next) => {
  try {
    const { id, houseName, price, location, rating, photoUrl } = req.body;
    const home = await Home.findById(id);
    if (!home) {
      return res.redirect("/host/host-homes");
    }
    if (home.host && home.host.toString() !== req.session.user._id.toString()) {
      return res.redirect("/host/host-homes");
    }

    home.houseName = houseName;
    home.price = Number(price) || 0;
    home.location = location;
    home.rating = Number(rating) || 5;
    home.photoUrl = photoUrl || home.photoUrl;
    await home.save();
    res.redirect("/host/host-homes");
  } catch (err) {
    console.log(err);
    res.redirect("/host/host-homes");
  }
};

exports.postDeleteHome = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const home = await Home.findById(homeId);
    if (home && home.host && home.host.toString() === req.session.user._id.toString()) {
      await Home.findByIdAndDelete(homeId);
    }
    res.redirect("/host/host-homes");
  } catch (err) {
    console.log(err);
    res.redirect("/host/host-homes");
  }
};

exports.getHostHomes = async (req, res, next) => {
  try {
    const homes = await Home.find({ host: req.session.user._id }).lean();

    res.render("host/host-homes", {
      homes,
      pageTitle: "Host Homes",
      isLoggedIn: true,
      user: req.session.user,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/host/host-homes");
  }
};
