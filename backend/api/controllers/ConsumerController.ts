import { Controller, Get, BaseRequest, BaseResponse, HttpError, HttpCode, Post, Put } from 'ts-framework';
import { ConsumerModel } from '../models/consumer/';
import { checkJwt } from '../middlewares/checkJwt';
import { checkRole } from '../middlewares/checkRole';

@Controller('/consumer')
export default class UserController {

  @Post('/', ) // [checkJwt, checkRole]
  static async storeUser(req: BaseRequest, res: BaseResponse) {

    const { name, email, role, password, height, weight, birthDate, personal} = req.body;

    const userdb = await ConsumerModel.findOne({email})

    if (userdb) {
      throw new HttpError('Email registrado na plataforma, prossiga com o login', HttpCode.Client.FORBIDDEN);
    }

    const insert = await ConsumerModel.create({
      name,
      email,
      role: "consumer",
      height, 
      weight, 
      birthDate, 
      personal
    });

    const user = await ConsumerModel.findOne({email})

    await user.setPassword(password);
    await user.save();

    return res.success(user);
  }

  @Get('/')
  static async findAll(req: BaseRequest, res: BaseResponse) {
    try {
      const users = await ConsumerModel.find()
      return res.success(users)
    } catch (error) {
      console.error(error)
    }
  }

  @Post('/:id', [checkJwt, checkRole])
  static async findAndUpdate(req: BaseRequest, res: BaseResponse) {
    const user = await ConsumerModel.findOneAndUpdate({
      email: req.body.email,
    }, {
      $set: { name: req.body.name },
    });

    return res.success(user);
  }

  @Post('/update', [checkJwt])
  static async updateUser(req: BaseRequest, res: BaseResponse) {
    const user = await ConsumerModel.findOneAndUpdate({
      email: req.body.email,
    },                                       {
      $set: {
          name: req.body.name,
          weight: req.body.weight,
          height: req.body.height,
          birthdate: req.body.birthdate,
          gender: req.body.gender
      },
    });

    return res.success(user);
  }


  @Post('/update_trainer', [checkJwt, checkRole])
  static async updateTrainer(req: BaseRequest, res: BaseResponse) {
    const user = await ConsumerModel.findOneAndUpdate({
      email: req.body.email,
    }, {
      $set: {
          name: req.body.name,
          email: req.body.email,
          telephone: req.body.telephone,
          cref: req.body.cref,
          gender: req.body.gender
      },
    });

    return res.success(user);
  }
}
