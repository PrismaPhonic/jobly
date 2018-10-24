const express = require('express');
const router = new express.Router();
const Company = require('../models/company');

//Get a filtered list of companies
router.get('/', async function(req, res, next) {
  try {
    const companiesResults = await Company.getFilteredCompanies(req.query);
    const companies = companiesResults.map(company => ({
      name: company.name,
      handle: company.handle
    }));
    return res.json({ companies });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;