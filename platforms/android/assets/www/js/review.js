//    
//        revPhotoReq.open("POST","https://griffis.edumedia.ca/mad9022/reviewr/review/set");

var app=
{
    reviews:"", //Reviews list div
    write:"", //Add a review div
    read:"", //View a single review div.
    revListReq:"", //XML object for getting a list of reviews
    revIndReq:"", //Object for getting specific reviews
    revPhotoReq:"", //Object for adding reviews
    hammerList:"", //List of hammer event listeners.
    fab:"",
    curPage:"",
    stars:0,
    sIcon:"",
    save:"",
    canvas:"",
    canvas_context:"",
    photoadded:"",
    this_uuid:"",
        
    main: function()
    {
        var fabpress, startouch, savepress, starzone, canvaszone;

        
        //Setting up star handler.
        sIcon=new Array(5);
        sIcon[0]=document.getElementById("s1");
        sIcon[1]=document.getElementById("s2");
        sIcon[2]=document.getElementById("s3");
        sIcon[3]=document.getElementById("s4");
        sIcon[4]=document.getElementById("s5");
        
 
        //Set up back button handling;
        history.replaceState({'page':'main'},null,'#main');
        window.addEventListener("popstate", app.popPrev);

        //Get page elements
        reviews=document.getElementById("reviews");
        write=document.getElementById("write");
        read=document.getElementById("read");
        fab=document.getElementById("add");
        save=document.getElementById("save");
        starzone=document.getElementById("starzone");
        canvas=document.getElementById("canvas");
        canvas_context=canvas.getContext("2d");
        photoadded=false;
        this_uuid=device.uuid;
        
   
        //Establish Connections
        revListReq = new XMLHttpRequest();
        revIndReq = new XMLHttpRequest();
        revPhotoReq = new XMLHttpRequest();
        
        //FABs and touch zones connected.
        fabpress=new Hammer(fab);
        fabpress.on("tap",app.addReview);
        
        fabpress=new Hammer(save);
        fabpress.on("tap",app.saveReview)
        
        startouch=new Hammer(starzone);
        startouch.on("tap",app.setStar);
        
        canvaszone=new Hammer(canvas);
        canvaszone.on("tap",app.getPhoto);
        
        //launch
        app.getReviews();
    },

    popPrev:function(ev)
    {
        //Pressing "back" always goes back to the list of reviews.
        ev.preventDefault();
        app.getReviews();
    },
        
    getReviews:function()
    {
        var uuidForm = new FormData();
  
        uuidForm.append("uuid", this_uuid);
        revListReq.open("POST", "https://griffis.edumedia.ca/mad9022/reviewr/reviews/get/");
            
        revListReq.send( uuidForm );
        revListReq.addEventListener("load", app.showReviews);
        revListReq.addEventListener("error", app.handleError);
    },
    
    
    showReviews: function(event)
    {
        var revList, i,revNum, divAdded, title, stars;
       //Consider adding "has changed" functionality.
        
        
        reviews.innerHTML="<h1>Reviews Available</h1>";
        history.pushState({'page':'main'},null,'#main');
        revList=JSON.parse(revListReq.responseText).reviews;
        revNum=revList.length;
        hammerList=new Array(revNum);

        write.setAttribute("data-vis","hide");
        read.setAttribute("data-vis","hide");
        reviews.setAttribute("data-vis","disp");
        fab.setAttribute("data-vis","disp");
        save.setAttribute("data-vis","hide");
        
            
        if(revNum==0)
        {
            divAdded=document.createElement("div");
            divAdded.setAttribute("class","reviews");
            title=document.createElement("p");
            title.setAttribute("class","title");
            title.innerHTML="No reviews from your device.  Press + below to add.";
            divAdded.appendChild(title);
            reviews.appendChild(divAdded);
        }
        else
        {
            for (var i=0;i<revNum;i++)
            {
                divAdded=document.createElement("div");
                divAdded.setAttribute("id",revList[i].id);
                divAdded.setAttribute("class","reviewitem");
                if (i==0)
                    {
                        divAdded.style.borderTop="1px black solid";
                    }
                
                title=document.createElement("p");
                title.setAttribute("class","title");
                title.innerHTML=revList[i].title;

                stars=document.createElement("p");
                stars.setAttribute("class","stars");

                for(var j=1;j<6;j++)
                {
                    if(j>revList[i].rating)
                    {
                        stars.innerHTML+="&#9734;";
                    }
                else
                    {
                        stars.innerHTML+="&#9733;";
                    }
                }
                divAdded.appendChild(title);
                divAdded.appendChild(stars);
                reviews.appendChild(divAdded);

                hammerList[i]=new Hammer(divAdded);
                hammerList[i].on("tap",app.getSpecific);
            }
        }
    },
    
    getSpecific:function(event)
    {
        var selected=event.target;
        var revQuery = new FormData();
        
        write.setAttribute("data-vis","hide");
        read.setAttribute("data-vis","disp");
        reviews.setAttribute("data-vis","hide");
        fab.setAttribute("data-vis","disp");
        save.setAttribute("data-vis","hide");
        
        //Looking for the div that got clicked, not its child elements.
        if (selected.className=="title"||selected.className=="stars")
        {
              selected=selected.parentElement;
        }

        revQuery.append("review_id",selected.id);
        revQuery.append("uuid",this_uuid);
        
        revIndReq.open("POST", "https://griffis.edumedia.ca/mad9022/reviewr/review/get/");
        revIndReq.send( revQuery );
        
        revIndReq.addEventListener("load", app.showSpecific);
        revIndReq.addEventListener("error", app.handleError);
    },
    

    showSpecific:function()
    {
        var revSpecific,workElement;
        read.innerHTML="";
        revSpecific=JSON.parse(revIndReq.responseText).review_details;
        
        workElement=document.createElement("h1");
        workElement.innerHTML=revSpecific.title;
        workElement.setAttribute("class","movtitle");
        read.appendChild(workElement);
        
        workElement=document.createElement("h1");
        workElement.setAttribute("class","movtitle");
        
        for(var j=1;j<6;j++)
        {
            if(j>revSpecific.rating)
            {
                workElement.innerHTML+="&#9734;";
            }
        else
            {
                workElement.innerHTML+="&#9733;";
            }
        }
        
        read.appendChild(workElement);
        
        workElement=document.createElement("p");
        workElement.setAttribute("class","reviewText");
        workElement.innerHTML=revSpecific.review_txt;
        read.appendChild(workElement);
        
        workElement=document.createElement("img");
        workElement.setAttribute("src",decodeURIComponent(revSpecific.img));
        workElement.setAttribute("class","reviewImage");
        read.appendChild(workElement);
        

    },

    addReview:function()
    {
        var revtitle, revtext, reviewpic;
        var sIcon=new Array(5);
        stars=0;
        phtoadded=false;
        app.showStar();
        
        write.setAttribute("data-vis","disp");
        read.setAttribute("data-vis","hide");
        reviews.setAttribute("data-vis","hide");
        fab.setAttribute("data-vis","hide");
        save.setAttribute("data-vis","disp");

        revtitle=document.getElementById("revtitle");
        revtext=document.getElementById("theReview");

        
        document.getElementById("warning").innerHTML="";
        revtitle.value="";
        revtext.value="";
        reviewpic=document.createElement("img");
        reviewpic.src="img/empty.jpg";
        reviewpic.onload=function()
        {
            canvas.height=reviewpic.height;
            canvas.width=reviewpic.width;
            canvas_context.drawImage(reviewpic,0,0);
        }
        
    },


    
    setStar:function(event)
    {
        var selected=event.target.id.substring(1);
        if (selected=="tarzone")
        {
            return;
        }
        else
        {
            stars=parseInt(selected);
            app.showStar();
        }
    },
    
    showStar:function()
    {
        for (var i=0;i<5;i++)
        {
            if(i>stars-1)
            {
                sIcon[i].innerHTML="&#9734;";
            }
            else
            {
                sIcon[i].innerHTML="&#9733;";
            }            
        }
    },
    
    getPhoto:function()
    {
        navigator.camera.getPicture( app.addPhoto, app.handleError,
        {
            quality : 75,                                 
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType : Camera.EncodingType.JPEG,
            mediaType: Camera.MediaType.PICTURE,
            cameraDirection : Camera.Direction.BACK,
            correctOrientation: true,
            saveToPhotoAlbum : false,
            targetWidth : 640,
        });
    },

    addPhoto:function(theImage)
    {
        var image=document.createElement("img");
        
        image.src = theImage;
        image.onload=function()
        {
            canvas.height=image.height;
            canvas.width=image.width;
            canvas_context.drawImage(image,0,0);
        }
        photoadded=true;
    },
    
    saveReview:function()
    {
        //Connect to database, send UUID, text, stars, title, image.
        //Check first for errors.
        var clean=true;
        var uploadparams = new FormData();
        
        var revtitle=document.getElementById("revtitle").value;
        var revtext=document.getElementById("theReview").value;
        var reviewpic=document.getElementById("reviewpic");
        var warning=document.getElementById("warning");
        warning.innerHTML="";
        if (revtitle==""||revtext=="")
        {
            warning.innerHTML+="Text fields may not be empty. ";
            clean=false;
        }
        if (revtitle.length>40)
        {
            warning.innerHTML+="Title must be 40 characters or less. ";
            clean=false;
        }
        if (revtext.length>255)
        {
            warning.innerHTML+="Review text must be 255 characters or less. ";
            clean=false;
        }
        if (stars==0)
        {
            warning.innerHTML+="Please select a star rating. "
            clean=false;
        }
        if (!photoadded)
        {
            warning.innerHTML+="Please take a photo."
            clean=false;
        }
        if (clean)
        {
            //Open DB connection and save.
            uploadparams.append("uuid",this_uuid);
            uploadparams.append("action","insert");
            uploadparams.append("title",revtitle);
            uploadparams.append("review_txt",revtext);
            uploadparams.append("rating",stars);
            uploadparams.append("img",canvas.toDataURL("image/jpeg"));
            
            revPhotoReq.open("POST", "https://griffis.edumedia.ca/mad9022/reviewr/review/set/");
            
        revPhotoReq.send(uploadparams);
        revPhotoReq.addEventListener("load", app.getReviews);
        revPhotoReq.addEventListener("error", app.handleError);
        }
    },
    
    handleError: function(err)
    {
        console.log("Unable to establish connection"+err);
    },
}

document.addEventListener("deviceready",app.main);
	
	
