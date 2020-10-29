import { getRepository } from 'typeorm';
import Orphanage from '../models/Orphanage';
import * as Yup from 'yup';
import orphanageView from '../views/orphanages_view';
import { Request, Response } from 'express';

export default {

  async index(request: Request, response: Response) {

    const { is_pending } = request.query;

    const orphanagesRepository = getRepository(Orphanage);
    
    const orphanages = await orphanagesRepository.find({
      relations: ['images'],
      where: {
        is_pending,
      }
    });

    return response.json(orphanageView.renderMany(orphanages));

  },

  async show(request: Request, response: Response) {

    const { id } = request.params;

    const orphanagesRepository = getRepository(Orphanage);

    const orphanage = await orphanagesRepository.findOneOrFail(id, {
      relations: ['images']
    });

    return response.json(orphanageView.render(orphanage));

  },
  
  async create(request: Request, response: Response) {
    const { 
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends
    } = request.body;
    
    const orphanagesRepository = getRepository(Orphanage);

    //É um array de arquivos, para faciliar na tipagem do multer com array de files
    const requestImages = request.files as Express.Multer.File[];

    const images = requestImages.map((image) => {
      return { path: image.filename }
    })

    const data = {
      name,
      latitude,
      longitude,
      about,
      instructions, 
      opening_hours,
      open_on_weekends: open_on_weekends === 'true',
      is_pending: true,
      images
    }

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      latitude: Yup.number().required(),
      longitude: Yup.number().required(),
      about: Yup.string().required().max(300),
      instructions: Yup.string().required(), 
      opening_hours: Yup.string().required(),
      open_on_weekends: Yup.boolean().required(),
      images: Yup.array(Yup.object().shape({
        path: Yup.string().required()
      }))
    })

    await schema.validate(data, {
      abortEarly: false,
    })

    const orphanage = orphanagesRepository.create(data)

    await orphanagesRepository.save(orphanage);

    return response.json(orphanage);
  },

  async update(request: Request, response: Response) {

    const { idOrphanage } = request.params;

    const orphanagesRepository = getRepository(Orphanage)

    const orphanage = await orphanagesRepository.findOne(idOrphanage);

    if(!orphanage) {
      return response.status(400).json({ error: 'Orphanage not found' });
    }

    const orphanageUpdated = await orphanagesRepository.save({
      ...orphanage,
      ...request.body
    });
    

    return response.json(orphanageUpdated);
  },

  async delete(request: Request, response: Response) {

    const { idOrphanage } = request.params;

    const orphanagesRepository = getRepository(Orphanage)

    const orphanage = await orphanagesRepository.findOne(idOrphanage);

    if(!orphanage) {
      return response.status(400).json({ error: 'Orphanage not found' });
    }

    await orphanagesRepository.delete(orphanage);

    return response.status(204).json();
  }
}