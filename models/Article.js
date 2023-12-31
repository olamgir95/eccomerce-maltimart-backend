const assert = require("assert");
const { shapeIntoMongooseObjectId } = require("../lib/config");
const articleModel = require("../schema/article.model");
const Definer = require("../lib/mistake");

class Article {
  constructor() {}
  async getAllArticlesData() {
    try {
      const result = await articleModel
        .aggregate([
          {
            $sort: { createdAt: -1 },
          },
          {
            $lookup: {
              from: "members",
              localField: "mb_id",
              foreignField: "_id",
              as: "member_data",
            },
          },
          { $unwind: "$member_data" },
        ])
        .exec();
      assert(result, Definer.general_err1);
      return result;
    } catch (err) {
      throw err;
    }
  }
  async updateArticleByAdminData(update_data) {
    try {
      const id = shapeIntoMongooseObjectId(update_data?.id);
      console.log("update", update_data);
      const result = await articleModel
        .findByIdAndUpdate({ _id: id }, update_data, {
          runValidators: true,
          lean: true,
          returnDocument: "after",
        })
        .exec();

      assert.ok(result, Definer.general_err1);
      return result;
    } catch (err) {
      throw err;
    }
  }
}
module.exports = Article;
