import { Controller, BaseRequest, BaseResponse, HttpError, HttpCode, Post } from 'ts-framework';
import { AdminModel } from '../models/admin';
import { ConsumerModel } from '../models/consumer';

import JwtService from '../services/JwtService';
import NotificationService from '../services/NotificationService';

@Controller('/auth')
export default class AuthController {

  @Post('/login')
  static async logIn(req: BaseRequest, res: BaseResponse) {
    try {
      const { email, password } = req.body;

      const consumerdb = await ConsumerModel.findOne({email});

      let admindb;

      if (!consumerdb) {
        
        admindb = await AdminModel.findOne({email})

        if (!admindb) {
          throw new HttpError('Email não registrado na plataforma', HttpCode.Client.NOT_FOUND);
        }
      }

      let userdb;

      if (consumerdb) {
        userdb = consumerdb
      } else {
        userdb = admindb
      }

      if (userdb) {
        const matchPassword = await userdb.validatePassword(password);
          if (!matchPassword){
            throw new HttpError('Senha incorreta, tente novamente', HttpCode.Client.FORBIDDEN);
          }
          else if (matchPassword) {
            const token = await JwtService.createSignToken(userdb);
    
            const {_id, name, email, role} = userdb
            return res.success({...token, role, _id, name, email});
          }
      }

    } catch (error) {
      console.error(error)
    }
  }

  @Post('/register')
  static async register(req: BaseRequest, res: BaseResponse) {
    try {

      const { name, email, password, height, weight, birthDate, trainerId } = req.body;

      const consumerdb = await ConsumerModel.findOne({email})

      if (consumerdb) {
        throw new HttpError('Email registrado na plataforma, prossiga com o login', HttpCode.Client.FORBIDDEN);
      }

      const admindb = await AdminModel.findOne({email})

      if (admindb) {
        throw new HttpError('Email registrado na plataforma, prossiga com o login', HttpCode.Client.FORBIDDEN)
      }

      const insert = await ConsumerModel.create({
        name,
        email,
        role: "consumer",
        trainerId,
        height, 
        weight, 
        birthDate
      });
  
      const consumer = await ConsumerModel.findOne({email})
  
      await consumer.setPassword(password);
      await consumer.save();

      const admin = await AdminModel.findOne({_id:trainerId})
      await admin.athletes.push(consumer._id)

      await admin.save()

      return res.success("Registro confirmado na plataforma")

    } catch (error) {
      return res.error(error)
    }
  }

  @Post('/register-admin')
  static async registerAdmin(req: BaseRequest, res: BaseResponse) { 
    try {

      const { name, email, password, phone, cref } = req.body;

      const admindb = await AdminModel.findOne({email})

      if (admindb) {
        throw new HttpError('Email registrado na plataforma, prossiga com o login', HttpCode.Client.FORBIDDEN);
      }
      
      const consumerdb = await ConsumerModel.findOne({email})

      if (consumerdb) {
        throw new HttpError('Email registrado na plataforma, prossiga com o login', HttpCode.Client.FORBIDDEN);
      }

      const insert = await AdminModel.create({
        name,
        email,
        role: "admin",
        phone,
        cref
      });
  
      const admin = await AdminModel.findOne({email})
  
      await admin.setPassword(password);
      await admin.save();

      return res.success("Registro confirmado na plataforma")

    } catch (error) {
      return res.error(error)
    }
  }

  @Post("/forgot-password")
  static async forgotPassword(req: BaseRequest, res: BaseResponse) {
    try {

      let userdb;
      let admindb;

      const consumerdb = await ConsumerModel.findOne({email: req.body.email})

      if(!consumerdb) {
        admindb = await AdminModel.findOne({email: req.body.email})
        if (admindb) {
          throw new HttpError('Email não registrado na plataforma', HttpCode.Client.NOT_FOUND);
        }
      }

      if(consumerdb) {
        userdb = consumerdb
      } else {
        userdb = admindb
      }

      const code = String(Math.floor(100000 + Math.random() * 900000))
      userdb.code = code;
      await userdb.save();

      const notification = await NotificationService.sendEmailForgotPassword(userdb);

      return res.success("Email enviado com sucesso")

    } catch (error) {
      console.error(error)
    }
  }

  @Post('/reset-password')
  static async resetPassword(req: BaseRequest, res: BaseResponse) {
    try {
      
      let userdb;
      let admindb;

      const consumerdb = await ConsumerModel.findOne({email: req.body.email})

      if(!consumerdb) {
        admindb = await AdminModel.findOne({email: req.body.email})
        if (admindb) {
          throw new HttpError('Email não registrado na plataforma', HttpCode.Client.NOT_FOUND);
        }
      }

      if(consumerdb) {
        userdb = consumerdb
      } else {
        userdb = admindb
      }

      if (userdb.code == req.body.code){

        const set_password = await userdb.setPassword(req.body.password);

        await userdb.save();

        return res.success(userdb)

      } else {
        throw new HttpError("Código incorreto", HttpCode.Client.NOT_FOUND);
      }

    } catch (error) {
      console.error(error)
    }
  }
}
