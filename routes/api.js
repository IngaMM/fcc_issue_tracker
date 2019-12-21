/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var ObjectId = require("mongodb").ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

const mongoose = require("mongoose");
mongoose.connect(CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var db = mongoose.connection;
db.once("open", function() {
  console.log("Successfully connected");
});

const Schema = mongoose.Schema;

let issueSchema = new Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  issue_title: { type: String },
  issue_text: { type: String },
  created_by: { type: String },
  assigned_to: { type: String },
  status_text: { type: String },
  created_on: { type: Date },
  updated_on: { type: Date },
  open: { type: Boolean }
});

function done(err, data) {
  if (err) {
    console.log(err);
  }
  if (data) {
    console.log(data);
  }
  return;
}

module.exports = function(app) {
  app
    .route("/api/issues/:project")

    .get(function(req, res) {
      var project = req.params.project;
      var Issue = mongoose.model("Issue", issueSchema, project);
      var issues = Issue.find({});
      if (req.query.issue_title) {
        issues = issues.where("issue_title").equals(req.query.issue_title);
      }
      if (req.query.issue_text) {
        issues = issues.where("issue_text").equals(req.query.issue_text);
      }
      if (req.query.created_on) {
        issues = issues
          .where("created_on")
          .gte(new Date(req.query.created_on).setHours(0, 0, 0, 0))
          .lte(new Date(req.query.created_on).setHours(23, 59, 59, 999));
      }
      if (req.query.updated_on) {
        issues = issues
          .where("updated_on")
          .gte(new Date(req.query.updated_on).setHours(0, 0, 0, 0))
          .lte(new Date(req.query.updated_on).setHours(23, 59, 59, 999));
      }
      if (req.query.created_by) {
        issues = issues.where("created_by").equals(req.query.created_by);
      }
      if (req.query.assigned_to) {
        issues = issues.where("assigned_to").equals(req.query.assigned_to);
      }
      if (req.query.status_text) {
        issues = issues.where("status_text").equals(req.query.status_text);
      }
      if (req.query.open) {
        var isTrueSet = req.query.open === "true";
        issues = issues.where("open").equals(isTrueSet);
      }
      issues.exec((err, issues) => res.send(issues));
    })

    .post(function(req, res) {
      var project = req.params.project;
      var Issue = mongoose.model("Issue", issueSchema, project);
      if (
        !req.body.issue_title ||
        req.body.issue_title === "" ||
        (!req.body.issue_text || req.body.issue_text === "") ||
        (!req.body.created_by || req.body.created_by === "")
      ) {
        res.send("missing input");
      } else {
        let assigned_to = req.body.assigned_to || "";
        let status_text = req.body.status_text || "";

        var issue = new Issue({
          _id: new mongoose.mongo.ObjectId(),
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: assigned_to,
          status_text: status_text,
          created_on: Date.now(),
          updated_on: Date.now(),
          open: true
        });

        issue.save(function(err, issue) {
          if (err) {
            return done(err);
          }

          var savedIssue = Issue.findOne(
            { issue_title: issue.issue_title },
            function(err, savedIssue) {
              if (err) {
                return done(err);
              }
              res.send({
                issue_title: savedIssue.issue_title,
                issue_text: savedIssue.issue_text,
                created_on: savedIssue.created_on,
                updated_on: savedIssue.updated_on,
                created_by: savedIssue.created_by,
                assigned_to: savedIssue.assigned_to,
                open: savedIssue.open,
                status_text: savedIssue.status_text,
                _id: savedIssue._id
              });
            }
          );
        });
      }
    })

    .put(function(req, res) {
      var project = req.params.project;
      var Issue = mongoose.model("Issue", issueSchema, project);
      let issue_title = req.body.issue_title || "";
      let issue_text = req.body.issue_text || "";
      let created_by = req.body.created_by || "";
      let assigned_to = req.body.assigned_to || "";
      let status_text = req.body.status_text || "";

      var issue = {
        issue_title: issue_title,
        issue_text: issue_text,
        created_by: created_by,
        assigned_to: assigned_to,
        status_text: status_text,
        updated_on: Date.now(),
        _id: req.body._id
      };
      if (req.body.open === "false") {
        issue.open = false;
      }

      for (let prop in issue) if (issue[prop] === "") delete issue[prop];

      Issue.findOne({ _id: req.body._id }, function(err, found_issue) {
        if (err) {
          res.send("could not update " + req.body._id);
        }

        if (
          (req.body.issue_title === "" || !req.body.issue_title) &&
          (req.body.issue_text === "" || !req.body.issue_text) &&
          (req.body.created_by === "" || !req.body.created_by) &&
          (req.body.assigned_to === "" || !req.body.assigned_to) &&
          (req.body.status_text === "" || !req.body.status_text) &&
          !req.body.open
        ) {
          res.send("no updated field sent");
        } else {
          Issue.findByIdAndUpdate(req.body._id, issue, {}, function(
            err,
            theissue
          ) {
            if (err) {
              return done(err);
            }

            res.send("successfully updated");
          });
        }
      });
    })

    .delete(function(req, res) {
      var project = req.params.project;
      var Issue = mongoose.model("Issue", issueSchema, project);
      if (!req.body._id) {
        res.send("id error");
      } else {
        Issue.findById(req.body._id, function(err, result) {
          if (err) {
            res.send("could not delete " + req.body._id);
          }
          Issue.findByIdAndRemove(req.body._id, function(err) {
            if (err) {
              return done(err);
            }
            res.send("deleted " + req.body._id);
          });
        });
      }
    });
};
