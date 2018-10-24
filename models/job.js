const db = require('../db');
const { sqlForPartialUpdate } = require('../helpers/partialUpdate');

class Job {
  constructor({ id, title, salary, equity, company_handle, date_posted }) {
    this.id = id;
    this.title = title;
    this.salary = salary;
    this.equity = equity;
    this.company_handle = company_handle;
    this.date_posted = date_posted;
  }

  // make setter/getter that makes it so you can't change primary key

  set id(val) {
    if (this._id) {
      throw new Error(`Can't change job id!`);
    }
    this._id = val;
  }

  get id() {
    return this._id;
  }

  //Get a filtered list of companies and return array of instances
  static async getFilteredJobs({ search, min_salary, min_equity }) {

    //If search is undefined then search will be %%
    let result = await db.query(
      `
    SELECT id,title,salary,equity,company_handle,date_posted
    FROM jobs 
    WHERE (title ILIKE $1 or company_handle ILIKE $1) 
    and salary > $2 and equity > $3`,
      [`%${search || ''}%`, min_salary || 0, min_equity || 0]
    );

    return result.rows.map(job => new Job(job));
  }

  //Create a new job and return an instance
  static async createJob({
    title,
    salary,
    equity,
    company_handle,
  }) {
    let result = await db.query(
      `
    INSERT INTO jobs (title,salary,equity,company_handle)
    VALUES ($1,$2,$3,$4)
    RETURNING id,title,salary,equity,company_handle,date_posted`,
      [title, salary, equity, company_handle]
    );

    if (result.rows.length === 0) {
      throw new Error('Cannot create job');
    }

    return new Job(result.rows[0]);
  }

  //Get job and return an instance
  static async getCompany(title) {
    let result = await db.query(
      `
    SELECT title,salary,equity,company_handle,date_posted
    FROM jobs 
    WHERE title = $1`,
      [title]
    );

    if (result.rows.length === 0) {
      const err = new Error('Cannot find job by that title');
      err.status = 400;
      throw err;
    }

    return new Job(result.rows[0]);
  }

  //Update a job and return an instance of the updated job
  async updateCompany() {
    const { query, values } = sqlForPartialUpdate(
      'companies',
      {
        salary: this.salary,
        equity: this.equity,
        company_handle: this.company_handle,
        date_posted: this.date_posted
      },
      'title',
      this.title
    );

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      const err = new Error('Cannot find job to update');
      err.status = 400;
      throw err;
    }

    return new Job(result.rows[0]);
  }

  //Delete job and return a message
  async deleteCompany() {
    const result = await db.query(
      `
    DELETE FROM companies 
    WHERE title=$1
    RETURNING title`,
      [this.title]
    );
    if (result.rows.length === 0) {
      throw new Error('Could not delete job');
    }
    return 'Job Deleted';
  }
}

module.exports = Job;
