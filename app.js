const express =require('express');

const bodyParser=require('body-parser');
const path=require('path');
const crypto=require('crypto');
const mongoose=require('mongoose');
const multer=require('multer');
const GridFsStorage=require('multer-gridfs-storage');
const Grid=require('gridfs-stream');
const methodOverride=require('method-override');

const app=express();
//Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine','ejs');

//Mongo URI

const mongoURI='mongodb://localhost/uploads';

//create mongo connection
const conn=mongoose.createConnection(mongoURI);

//Init gfs
let gfs;
//Initalize the stream
conn.once('open', ()=> {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads')
  })
//Create storage engine
 
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });


//@route GET/
//@desc Loads form
app.get('/',(req,res)=>{

    gfs.files.find().toArray((err,files)=>{
        if(!files||files.length===0){
             res.render('index',{files:false});

        }
        else{
            

                /*if(file.contentType==='image/jpeg'|| file.contentType==='image/png' ){
                    file.isImage=true;
                }else{
                    file.isImage=false;
                }*/

               
                res.render('index',{files:files});
        }
    })

});

//@route POST/upload
//@desc uplads file to DB
app.post('/upload', upload.single('myfile'), (req, res) => {

    res.redirect('/');
})
//shows all files
app.get('/files',(req,res)=>{
    gfs.files.find().toArray((err,files)=>{
        if(!files||files.length==0){
            return res.status(404).json({
                err: 'No files exits'
            });

        }
        //Files exits
        return res.json(files);
    })
})
//shows one files with /files/:id 

app.get('/files/:filename',(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
       
            if(!file||file.length===0){
                return res.status(404).json({
                    err: 'No files exits'
                });
    
            }
            //Files exits
            return res.json(file);

    }) 
});
//show the  files in view form
//Display image
app.get('/image/:filename',(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
       
            if(!file||file.length===0){
                return res.status(404).json({
                    err: 'No files exits'
                });
    
            }
           //check the format of file
          // if(file.contentType==='image/jpeg'|| file.contentType==='img/png'){
               //Read output stream
               const readstream=gfs.createReadStream(file.filename);
               readstream.pipe(res);
        /*   }
        else{
            res.status(404).json({
                err:"Not an image"
            })
        }*/
    }) 
});

const port=5000;
app.listen(port,()=>{
    console.log(`Server started on ${port}`);
})