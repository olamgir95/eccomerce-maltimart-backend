const assert = require("assert");
const memberModel = require("../schema/member.model");
const bcrypt = require("bcryptjs");
const View = require("./View");

class Member {
  constructor() {}

  async signupData(input) {
    try {
      const salt = await bcrypt.genSalt();
      console.log("res", input);
      input.mb_password = await bcrypt.hash(input.mb_password, salt);
      const new_member = new memberModel(input);
      let result;
      try {
        result = await new_member.save();
      } catch (mongo_err) {
        console.log(mongo_err);
        throw new Error("Mongo validation error occurred.");
      }
      result.mb_password = "";

      return result;
    } catch (err) {
      throw err;
    }
  }

  async loginData(input) {
    try {
      const member = await memberModel
        .findOne({ mb_nick: input.mb_nick }, { mb_nick: 1, mb_password: 1 })
        .exec();
      assert.ok(member, "Authentication error: Member not found.");

      const isMatch = await bcrypt.compare(
        input.mb_password,
        member.mb_password
      );
      assert.ok(isMatch, "Authentication error: Incorrect password.");
      return await memberModel.findOne({ mb_nick: input.mb_nick }).exec();
    } catch (err) {
      throw err;
    }
  }

  async getChosenMemberData(member, id) {
    try {
      const auth_mb_id = shapeIntoMongooseObjectId(member?._id);
      id = shapeIntoMongooseObjectId(id);

      let aggregateQuery = [
        { $match: { _id: id, mb_status: "ACTIVE" } },
        { $unset: "mb_password" },
      ];

      if (member) {
        await this.viewChosenItemByMember(member, id, "member");
        aggregateQuery.push(lookup_auth_member_liked(auth_mb_id));
        aggregateQuery.push(
          lookup_auth_member_following(auth_mb_id, "members")
        );
      }

      const result = await memberModel.aggregate(aggregateQuery).exec();
      assert.ok(result, Definer.general_err2);
      return result[0];
    } catch (err) {
      throw err;
    }
  }

  async viewChosenItemByMember(member, view_ref_id, group_type) {
    try {
      view_ref_id = shapeIntoMongooseObjectId(view_ref_id);
      const mb_id = shapeIntoMongooseObjectId(member._id);

      const view = new View(mb_id);
      //validation needed
      const isValid = await view.validateChosenTarget(view_ref_id, group_type);
      console.log("isValid", isValid);
      assert.ok(isValid, Definer.general_err2);

      //logged user has seen target before
      const doesExist = await view.checkViewExistence(view_ref_id);
      console.log("doesexit", doesExist);
      if (!doesExist) {
        const result = await view.insertMemberView(view_ref_id, group_type);
        assert.ok(result, Definer.general_err1);
      }
      return true;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Member;
